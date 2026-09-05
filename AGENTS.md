# Gatekeeper — project rules

Self-hosted IAM: authentication, sessions, passkeys, MFA, SSO, scoped roles. Deno + oRPC. One
contract, served as RPC, REST and browser forms.

## Code style

**No explanatory comments.** Code must be self-documenting. When a line needs explaining, that is a
signal to rename it, extract it into a named function, or lift the value into a named constant — not
to annotate it.

```ts
// wrong
// 303 forces the follow-up to be a GET, so a refresh cannot resubmit the form
return new Response(null, { status: 303, headers })

// right
const SEE_OTHER_FORCES_GET_ON_REFRESH = 303
return new Response(null, { status: SEE_OTHER_FORCES_GET_ON_REFRESH, headers })
```

**JSDoc on exported symbols is the exception, and is encouraged.** It is API documentation, not an
inline comment: it reaches consumers as an IDE hover, and `packages/sdk` and `packages/contract` are
published. Write it for the caller — what the symbol does, what it returns, what will surprise them
— and never to narrate the implementation. If a JSDoc block explains how the body works, the body
needs renaming instead.

Otherwise the only comments permitted:

- `TODO:` / `FIXME:` markers for unfinished work
- Directives the toolchain requires (`oxlint-disable`, `@ts-expect-error`)
- The `-- ...` header on a raw SQL file naming what it defines

Design rationale that genuinely needs prose belongs in `README.md` or in `docs/`, where it is read
once, not in the file where it is re-read forever.

**Formatting** is enforced by `deno fmt` and not negotiable per file: no semicolons, single quotes,
100-column lines, 2-space indent.

**SQL is lowercase.** Keywords, identifiers, functions and expressions in raw SQL all use lowercase.

**File length: 350 lines.** `deno lint` fails past it. Exceed it only when splitting would genuinely
hurt — a single generated file, or one cohesive schema — and expect to justify it.

## Architecture

**The contract is the source of truth.** `packages/contract` holds the API definition and nothing
else: no logic, no database, no server imports. Both the server and the SDK depend on it, so a
change there surfaces as a compile error on every side at once.

Never implement a procedure that is not in the contract. Add it to the contract first, then run
`deno task gen:stubs` and fill in the handler.

**Three surfaces, one router.**

| Path      | Handler          | Consumer                                      |
| --------- | ---------------- | --------------------------------------------- |
| `/rpc/*`  | `RPCHandler`     | the JS SDK; preserves `Date`, `Map`, `bigint` |
| `/api/*`  | `OpenAPIHandler` | REST and OpenAPI, for non-TypeScript callers  |
| `/form/*` | `handleForm`     | plain HTML forms; cookies and 303 redirects   |

Standards endpoints (`/.well-known/*`, SAML ACS, OAuth callback) are plain HTTP routes, because
external identity providers redirect browsers straight at them.

**Postgres schemas, not prefixes.** `auth` for identity, `rbac` for authorization, `audit` for the
trail. `public` is left free for the host application.

**Authorization is scoped grants.** A `rbac.user_roles` row carries a scope: global, an
organization, or one resource. Membership is a grant, never a foreign key on the user — which is
what makes "zero workspaces" a valid state.

**Hooks carry product-specific flows.** `sql` hooks run inside the caller's transaction and are the
only correct choice when an effect must be atomic with the operation. `http` hooks are for side
effects and, on after-events, go through the `auth.hook_deliveries` outbox rather than blocking a
transaction.

**Permissions are not quotas.** A permission answers whether a subject may act at all; an
entitlement answers whether their plan has room left. They live in different tables and must not be
conflated.

## Security rules

These are not style preferences. Breaking one is a defect.

- Password hashing is Argon2id. Never anything else, never a bare hash.
- Refresh tokens are opaque, stored only as SHA-256 hashes, and rotate on every use. Replay of a
  spent token revokes the whole session family.
- Secrets at rest (TOTP seeds, SSO client secrets, SAML keys) are encrypted with a DEK from
  `auth.encryption_keys`, itself wrapped by the environment KEK.
- Login responses must not reveal whether an account exists. "No such user" and "wrong password" are
  the same answer.
- Any user-supplied redirect target is validated against an allowlist before use. An unchecked
  `redirect_to` on an identity provider is an open redirect.
- Anything reached with a cookie needs CSRF protection. `SameSite` alone is not enough.
- `X-Forwarded-For` is trusted only when `TRUST_PROXY` is set, or per-IP rate limiting is trivially
  bypassed.
- Never log a token, a password, a secret, or a full authorization header.
- Dependencies are pinned to exact versions and `minimumDependencyAge` stays on.

Planned work and its ordering live in `TODO.md`. Check it before starting something large — the
milestones are dependency-ordered for a reason.

## Working in this repo

```sh
deno task verify     # fmt:check + lint + check, the gate before any change lands
deno task check      # type-check every package
deno task lint       # oxlint, including the 350-line rule
deno task fmt        # oxfmt for code, deno fmt for markdown and YAML
deno task test
deno task dev        # run the API with reload
deno task gen:stubs  # scaffold handlers for new contract procedures
deno task openapi    # emit the OpenAPI document
```

Before calling any change done: `deno task verify`.

Database changes are schema-first: edit `packages/db/src/schema/*.ts`, then `deno task db:generate`,
then `deno task db:migrate`. Never hand-edit a generated migration. Raw SQL that Drizzle cannot
express — functions, grants, extensions — lives in `packages/db/sql/`.

## Docker

One Dockerfile, at the repository root, built for production. There is no development image: local
development runs `deno task dev` directly against the Postgres and Redis from `docker compose`.
