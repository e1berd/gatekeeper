# Gatekeeper

Self-hosted identity and access management: authentication, sessions, passkeys, MFA, enterprise SSO,
and a scoped role system — behind one typed API.

Built on Deno + oRPC. One contract is served three ways: RPC for the JavaScript SDK, REST for
everything else, and an OpenAPI document for client generation.

## Status

Scaffold. See [TODO.md](TODO.md) for the road to MVP. The contract, the database schema, and the
serving layer are complete and type-checked; handlers are stubs that return `501 NOT_IMPLEMENTED`.
That is deliberate — the API surface is agreed first, so filling in a handler is a purely local
change that cannot break its callers.

## Quick start

```sh
cp gatekeeper.example.yaml gatekeeper.yaml
openssl rand -base64 32                 # paste into security.kek

deno task up                            # postgres + redis + migrations + api
curl localhost:8080/healthz

deno task openapi > openapi.json        # the REST contract, for other languages
```

Without Docker:

```sh
deno task db:migrate
deno task dev
```

## Layout

```
packages/contract   The API definition. No logic, no server code — the client
                    depends on this and nothing else.
packages/db         Drizzle schema for the auth / rbac / audit Postgres schemas,
                    plus the SQL functions that resolve permissions.
packages/sdk        @gatekeeper/sdk — typed client with token storage, an
                    Authorization header, and deduplicated refresh.
apps/server         Implementation of the contract, and the HTTP surface.
```

## Design

**Postgres schemas, not table prefixes.** Identity lives in `auth`, authorization in `rbac`, the
trail in `audit`. `public` is left alone, so Gatekeeper can share a database with an application
without colliding with it, and the application role can be granted `usage` on exactly the schemas it
needs.

**Realms are the isolation boundary.** Every table carries `realm_id`. One deployment serves dev,
staging, prod and several products without them being able to see each other's users.

**Membership is a grant, not a foreign key.** `rbac.user_roles` rows carry a scope: global, an
organization, or a single resource. A user in six workspaces has six rows; a user in none has zero
rows and works perfectly well. This is what makes "owner of Acme, viewer of Globex, and neither
anywhere else" expressible without a role per workspace.

**Permissions are not quotas.** Whether someone may create a workspace is a permission; whether
their plan has room for another is an entitlement. They are different tables and different
questions, and `authz.check` answers both so a caller never has to assemble the decision from two
services.

**Tokens.** Access tokens are short-lived Ed25519 JWTs verifiable against JWKS, so resource servers
never call Gatekeeper on the hot path. Refresh tokens are opaque, stored only as hashes, and rotate
on every use; replaying a spent one revokes the whole session family. Sessions record an AAL, so a
sensitive operation can demand step-up without ending the session.

**Secrets at rest.** Envelope encryption: `security.kek` from the runtime configuration wraps DEKs
in `auth.encryption_keys`, which encrypt TOTP seeds, SSO client secrets and SAML keys. Rotating the
master key rewraps a handful of rows, not every secret.

**Redis is optional.** Set `redis.url` to `null` for a single-node deployment. Configure it only
when several replicas must share one rate-limit budget — lockout counters are in Postgres, and the
permission cache is keyed by `permissions_version`, so an entry cannot go stale without becoming
unreachable.

**Per-realm policy.** Password rules, token lifetimes, lockout thresholds and MFA requirements are
stored in `auth.realms.settings`, not in environment variables, so one deployment can hold a strict
production realm beside a relaxed development one.

**Supply chain.** `minimumDependencyAge` is on and versions are pinned, so a package published
minutes ago cannot be pulled into an authentication service.

## Browser forms

`/form/*` serves plain `<form method="post">` submissions: it sets httpOnly cookies and answers
`303`, because a browser navigating to a JSON response renders JSON.

```html
<form method="post" action="https://id.myapp.com/form/sign-up">
  <input type="hidden" name="redirect_to" value="https://myapp.com/welcome">
  <input name="email" type="email" required>
  <input name="password" type="password" required>
  <button type="submit">Sign up</button>
</form>
```

CSRF is defended primarily by `Origin`, not by a token: a submission carrying an `Origin` outside
`browser.allowedFormOrigins` is rejected outright, and the signed `csrf` field is required only when
a client sends no `Origin` at all. That means an application rendering its own login page needs no
token plumbing — no endpoint to call, no meta tag to embed.

`redirect_to` is checked against `browser.allowedRedirectOrigins`. An unvalidated one would be an
open redirect on an identity provider.

## Hooks

Extension points for flows Gatekeeper cannot know about — "create a default workspace on sign-up",
"reject sign-ups outside our domain", "add a claim".

| Event                                                                         | Blocking |
| ----------------------------------------------------------------------------- | -------- |
| `before_sign_up`, `before_sign_in`, `before_password_change`                  | yes      |
| `before_org_create`                                                           | yes      |
| `before_token_issue`                                                          | yes      |
| `after_sign_up`, `after_sign_in`, `after_org_create`, `after_invite_accepted` | no       |

Two kinds, chosen per hook:

- **`sql`** — a Postgres function `f(payload jsonb) returns jsonb`, run inside the caller's
  transaction. Use it when the effect must be atomic with the operation: a sign-up that creates a
  workspace either does both or neither.
- **`http`** — a signed webhook. Blocking events await it; after-events are written to
  `auth.hook_deliveries` and delivered by a background worker with exponential backoff, so a slow
  endpoint cannot hold a transaction open.

A hook returns `{"decision":"deny","code":"…","message":"…"}` to reject, or `{"claims":{…}}` /
`{"patch":{…}}` to contribute data.

```sql
create function app.after_sign_up(payload jsonb) returns jsonb
language plpgsql as $$
declare new_org_id uuid;
begin
  insert into rbac.organizations (realm_id, slug, name, owner_id)
  values ((payload->>'realmId')::uuid, 'ws-' || (payload->>'userId'),
          payload->>'email', (payload->>'userId')::uuid)
  returning id into new_org_id;

  insert into rbac.user_roles (user_id, role_id, scope_type, scope_id)
  select (payload->>'userId')::uuid, id, 'org', new_org_id::text
  from rbac.roles where key = 'owner';

  return jsonb_build_object('decision', 'allow');
end $$;
```

## What is not in the RPC contract

`/.well-known/jwks.json`, `/.well-known/openid-configuration`, the SAML ACS endpoint and the OAuth
callback are plain HTTP routes. External identity providers and relying parties redirect browsers
straight at them by URL, so they answer to the standards rather than to our protocol.

## Tasks

|                         |                                          |
| ----------------------- | ---------------------------------------- |
| `deno task dev`         | Run the API with reload                  |
| `deno task check`       | Type-check every package                 |
| `deno task openapi`     | Emit the OpenAPI 3.1 document            |
| `deno task db:generate` | Generate a migration from schema changes |
| `deno task db:migrate`  | Apply migrations                         |
| `deno task up` / `down` | Full stack via Docker                    |
