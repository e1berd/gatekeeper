# Road to MVP

## Where we are

| Layer             | State                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Contract          | **86 procedures** across auth, passkey, mfa, org, authz, sso, hooks, admin                    |
| Database          | **31 tables** in `auth` / `rbac` / `audit`, migrations apply cleanly                          |
| Authorization SQL | `effective_permissions`, `has_permission`, `quota_remaining` — verified against live Postgres |
| Serving           | `/rpc`, `/api`, `/form` all route; OpenAPI 3.1 generates from the contract                    |
| Hooks             | SQL and HTTP runners plus the delivery outbox — verified end to end                           |
| Forms             | Origin-based CSRF, cookie sessions, 303 redirects, open-redirect guard                        |
| SDK               | Token storage, auth header, deduplicated refresh                                              |
| **Handlers**      | **85 of 86 are `todo()` stubs returning 501** — only `health` is real                         |
| Crypto            | **Nothing yet.** No hashing, no signing, no JWKS, no encryption at rest                       |
| Tests / CI        | **None**                                                                                      |
| Docs              | `README.md` and `AGENTS.md` only                                                              |

The shape is done; the substance is not. Everything below is ordered so that each milestone only
depends on the ones above it.

## What MVP means

A deployment a team can put in front of a real product: sign up, sign in with a password or a
passkey, add TOTP, invite people into workspaces, hand out scoped roles, and administer all of it —
with an audit trail and documentation.

**Deliberately out of MVP**, though the contract already describes them:

- SAML and OIDC _federation_ (`sso.*`) — enterprise sales requirement, not a first-release one, and
  each is a week on its own.
- Being an OIDC _provider_ for third-party relying parties (`/oidc/*`).
- SCIM provisioning.

Social login (`auth.oauthStart` / `oauthExchange`) **is** in MVP: Google and GitHub are table
stakes.

---

## M1 — Crypto core

Nothing else can be finished before this exists.

- [x] `lib/password.ts` — Argon2id via `@node-rs/argon2`, OWASP params (m=19456 KiB, t=2, p=1),
      rehash-on-login when params change
- [x] `lib/secrets.ts` — envelope encryption: KEK from env unwraps a DEK from
      `auth.encryption_keys`, AES-256-GCM for TOTP seeds, SSO client secrets and SAML keys
- [x] `lib/keys.ts` — signing key generation, load the active key per realm from
      `auth.signing_keys`, rotation that keeps old public keys published
- [x] **Decide the signing algorithm before a single token is issued.** ES256 is the default, EdDSA
      stays available per realm. `auth.signing_keys.algorithm` defaults to `ES256`.
- [ ] Verify an ES256 round trip against `firebase/php-jwt` and one JVM library. The decision is
      made on interop grounds, so the claim is worth proving before the first integration guide.
- [x] `lib/tokens.ts` — JWT issue and verify with `jose`; opaque token generation with SHA-256
      storage; timing-safe comparison
- [x] `GET /.well-known/jwks.json` serves every non-expired public key
- [x] `GET /.well-known/openid-configuration` — the discovery document needed to _verify_ tokens:
      `issuer`, `jwks_uri`, `id_token_signing_alg_values_supported`. Small and static, and it is
      what lets Laravel, Spring, Django and ASP.NET integrate with off-the-shelf libraries instead
      of hand-written code. Not to be confused with being a full OIDC provider, which stays
      post-MVP.
- [x] Key bootstrap on first boot when `security.signingKey` is unset. Runs for every realm before
      the listener starts, so the JWKS is never served empty to a resource server that caches it.

## M2 — Sessions and tokens

- [x] Session creation with `aal` and `amr`
- [x] Refresh rotation: issue child, mark parent used, **revoke the whole family on replay** of a
      spent token
- [x] Idle expiry from `refreshedAt`, absolute expiry from `notAfter`
- [x] `auth.refresh`, `auth.signOut` (local and global), `auth.getSession`
- [x] `auth.listSessions`, `auth.revokeSession`
- [x] `auth.switchOrg` — re-mint an access token bound to another organization. Membership is proven
      by holding a role in that scope, and the binding is stored on the session so a refresh does
      not silently drop back to the global scope.
- [x] Claim shape frozen and documented: `sub`, `sid`, `realm`, `aal`, `amr`, `org`, `roles`, `pv`,
      `act`, alongside the standard `iss`, `aud`, `exp` and `nbf`
- [x] `aud` comes from `tokens.audience` in the realm settings and falls back to the issuer. A realm
      is one product, so its resource servers share an audience and a token minted for one realm
      cannot be replayed against another.

## M3 — Rate limiting and lockout

- [x] `requireAuth` — verify the JWT against the realm's keys, confirm the session is live, reject
      when `pv` no longer matches `users.permissions_version`. Landed with M2, because every other
      procedure in that milestone is authenticated and could not otherwise be exercised.
- [x] Impersonation: `requireAuth` reads `act` from the session rather than trusting the claim, and
      rejects a token whose `act` disagrees with it. `refuseWhileImpersonating` blocks the
      privilege-widening procedures — credential and factor changes, identity linking, admin
      password reset, and impersonating again. Read-only access is untouched.
- [x] Rate limiting per IP and per identifier, on fixed one-minute windows keyed by the clock so
      `retryAfter` is exact and replicas agree. Budgets live in `rateLimit` in the realm settings.
      Note: `@orpc/server/helpers` has no ratelimit export in 2.0.0-beta.32 — it ships cookies,
      signing and base64 only — so this is built on `lib/store.ts`, which existed for it.
- [x] Exponential lockout driven by `users.failed_attempts` / `last_failed_at`: `lib/lockout.ts`
      doubles the window past the threshold, caps it, measures from the last failure and lets an
      administrative ban outrank the counter. Unit-tested; the calls that feed it land with
      `signInPassword` in M4, which is the only thing that can fail an attempt.
- [x] Enumeration protection: `opaque` collapses the codes, `burnPasswordVerification` spends the
      same Argon2id work for an address with no account, and `notFasterThan` puts a floor under the
      whole attempt so a fast rejection cannot be timed apart from a slow one. Unit-tested; wired
      into the sign-in handler in M4.

## M4 — Password and email flows

- [x] `auth.signUp`, `auth.signInPassword`
- [x] Wire M3 into `signInPassword`: `lockoutVerdict` before the password check,
      `recordFailedAttempt` / `clearFailedAttempts` after it, `burnPasswordVerification` when no
      user matches, and the whole attempt inside `notFasterThan`. Measured: an unknown address, a
      wrong password and a correct one all answer in 252-256 ms.
- [x] Honour `signUp.requireEmailVerification` from the realm settings: when it is off, the address
      is marked verified at sign-up and tokens are returned instead of `verification_required`.
- [ ] Honour `signUp.requireEmailVerification` from the realm settings: when it is off, mark the
      address verified at sign-up and return tokens instead of `verification_required`. This is the
      knob a development realm turns off, and the reason it is a realm setting rather than a
      deployment-wide flag — one deployment holds a strict production realm beside a relaxed one.
- [x] `auth.verifyEmail`, `auth.requestPasswordReset`, `auth.resetPassword`, `auth.changePassword`.
      A reset ends every session; `changePassword` with `revokeOtherSessions` spares the caller's.
- [ ] `auth.signInOtp`, `auth.verifyOtp` — blocked on delivery, see M8
- [x] `auth.oauthStart` / `auth.oauthExchange` with PKCE, Google and GitHub. Two independent PKCE
      exchanges: the caller's against Gatekeeper, and Gatekeeper's against the provider, whose
      verifier is sealed with the realm data key until the callback needs it. `state` and the
      authorization code are both single-use and stored only as digests.
- [ ] Verify the provider leg against live credentials. Everything up to the token endpoint is
      exercised — Google answers our exchange with a structured 401 for the fake client — but the
      profile fetch, linking and code issuance after a _successful_ exchange are not. Closing this
      wants a stub provider in the M9 harness, which in turn wants per-provider endpoint overrides
      in `oauth.<slug>` — the same knob a self-hosted GitLab or Keycloak would need anyway.
- [x] Account linking: a second provider for an existing email creates an `auth.identities` row
      rather than a second user — but only when the provider reports that address as verified. An
      unverified address that already has an account is refused with `EMAIL_TAKEN`, because
      honouring it would let anyone who can set a profile email take over the account.
- [x] One-time tokens hashed, single-use, expiring. Issuing consumes any unused token of the same
      type for that user, so a resend cannot leave two live links behind, and the redemption is the
      `update ... returning` itself, so two concurrent claims cannot both win.

## M5 — Passkeys and MFA

- [ ] Passkey registration and authentication via `@simplewebauthn/server`
- [ ] Usernameless sign-in with discoverable credentials
- [ ] Sign-count regression detection; unique `credential_id` enforced
- [ ] FIDO MDS blob: verify AAGUID, allow an operator to restrict authenticators
- [ ] TOTP enrolment and verification via `otpauth`, QR generation
- [ ] Recovery codes: generated once, stored hashed, single-use
- [ ] `mfa.stepUp` raises session AAL without a full re-login
- [ ] `requireAal('aal2')` applied to every security-settings procedure

## M6 — Organizations, invitations, authorization

- [ ] Organization CRUD; creation grants `owner` in the same transaction
- [ ] Invitations by email, accepted by users who may not exist yet
- [ ] Last-owner guard on `removeMember`, `leave`, `setMemberRole`
- [ ] `transferOwnership`
- [ ] `authz.check` and `checkBulk` over Redis, keyed by user id plus `permissions_version`,
      invalidated by bumping that counter
- [ ] `authz.effectivePermissions`, `listSubjectsWithPermission`
- [ ] Seed system roles (`owner`, `admin`, `member`, `viewer`) per realm

## M7 — Administration, audit, hooks

- [ ] All 25 `admin.*` handlers
- [ ] Audit writes on every security-relevant action, with the acting admin recorded on impersonated
      calls
- [ ] `GRANT`s that make `audit` append-only for the application role
- [ ] Hook CRUD (6 procedures); the runner itself is already done
- [ ] Wire hook points into the flows: `before_sign_up`, `after_sign_up`, `before_sign_in`,
      `after_sign_in`, `before_token_issue`, `before_org_create`, `after_org_create`,
      `after_invite_accepted`, `before_password_change`

## M8 — Email and the form surface

- [ ] SMTP **client** talking to an external relay — Gatekeeper is never a mail server. `smtpUrl`
      points at whatever the operator's provider gives them, and delivery, SPF and DKIM stay that
      provider's problem. `lib/mail.ts` already has the `Mailer` seam and the message bodies; every
      send currently goes to the log, and a configured `mail.smtpUrl` warns once that nothing leaves
      the process.
- [ ] Templates: verification, password reset, OTP, invitation, new-device alert
- [ ] Per-realm branding for these templates
- [ ] Locale resolution for the server-rendered surfaces — email templates and `/form/*` pages —
      from the realm default, overridden per request by `Accept-Language`. API error responses stay
      locale-independent: they carry a stable `code` and the client owns the copy (see the errors
      concept page)
- [ ] Extend `/form/*`: `verify-email`, `reset-password`, `accept-invitation`, `mfa-challenge`
- [ ] Endpoint issuing a CSRF token for callers that render pages server-side and cannot rely on
      `Origin`
- [ ] Multi-step form flows carried through `auth.flow_state`

## M8.5 — Expiry sweeping

Nothing currently deletes anything. Every table below accumulates rows for the life of the
deployment, and none of them is indexed for a time-ranged delete.

- [ ] Add the indexes a sweeper needs: `sessions(not_after)`, `sessions(refreshed_at)`,
      `refresh_tokens(expires_at)`, `one_time_tokens(expires_at)`, `saml_relay_states(expires_at)`,
      `hook_deliveries(status, created_at)`
- [ ] Sweeper deleting expired sessions and their refresh-token families, consumed and expired
      one-time tokens, spent challenges, stale flow state and SAML relay states, and delivered hook
      deliveries past a retention window
- [ ] Batch and rate-limit the deletes so a first run on a large table does not lock out live
      traffic
- [ ] Retain `audit.log` on its own schedule — it is a compliance record, not cache, and is
      partitioned rather than swept
- [ ] Make the retention windows realm settings, and document the defaults

## M9 — Operations

- [ ] Unit tests for crypto, token rotation, permission resolution. `tokens_test.ts` covers issue
      and verify, audience and issuer binding, expiry, unpublished keys and opaque tokens; the
      database-backed paths in `secrets.ts` and `keys.ts` still need the integration harness below.
- [ ] Integration tests against a real Postgres container, covering the flows already exercised by
      hand: sign-up creating a workspace atomically, quota denial, refresh replay revoking a family
- [ ] `deno task test` green, wired into `deno task verify`
- [ ] CI: `verify` plus migrations plus tests on every push
- [ ] Bootstrap CLI: create the first realm, seed roles, create the first admin
- [ ] Structured JSON logging with request ids; never log tokens or secrets
- [ ] `/healthz` reports database and Redis separately
- [ ] Backup and restore procedure, and a documented key-rotation runbook
- [ ] Publish `@gatekeeper/sdk` to npm and JSR

---

## M10 — Documentation site (Astro)

`apps/docs`, Astro 5 with Starlight.

- [ ] **Spike first:** confirm Astro and Starlight build under the Deno workspace
      (`deno run -A npm:astro`). Astro's toolchain assumes Node, and this is the one integration in
      the repo with real risk of not fitting. If it fights back, give `apps/docs` its own Node
      toolchain rather than bending the rest of the project around it.
- [ ] Static output, served from the same container or from a CDN

### Content

- [ ] **Start** — what Gatekeeper is, when not to use it, five-minute `docker compose` walkthrough
- [ ] **Concepts** — realms; users and identities; sessions, AAL and token rotation; roles, scopes
      and inheritance; permissions versus entitlements; hooks; error codes and localization. This is
      where the design rationale lives: the no-comments rule means prose that would once have sat
      above a function belongs here.
- [ ] **Guides** — password auth; passkeys; TOTP and recovery codes; social login; organizations and
      invitations; the workspace-on-signup flow as a worked example; HTML forms without JavaScript;
      writing a SQL hook; writing an HTTP hook
- [ ] **Resource-server guides** — protecting an existing application with Gatekeeper, one page per
      stack, every one built on local JWKS verification rather than a call per request: Laravel,
      Express and Fastify, Django, Spring, ASP.NET. Each covers public versus authenticated routes,
      just-in-time user provisioning keyed on `sub`, roles from claims versus `authz.check`, and
      refreshing a cookie session server-side without JavaScript.
- [ ] **Reference** — REST API generated from `openapi.json` via `starlight-openapi`, so it cannot
      drift from the contract; SDK reference; every environment variable; the database schema
- [ ] **Operations** — deployment, reverse proxy and `TRUST_PROXY`, cookie domains across
      subdomains, key rotation, backups, upgrades
- [ ] **Security** — the threat model, what Gatekeeper defends against and what it does not, and how
      to report a vulnerability

### Plumbing

- [ ] `deno task docs:dev` and `docs:build`
- [ ] Regenerate `openapi.json` during the docs build so the API reference is never stale
- [ ] Diagrams for the flows that are hard to read as prose: refresh rotation with reuse detection,
      the passkey ceremony, invitation acceptance
- [ ] Link-check in CI

---

## Open questions

- **SDK docs comments.** The no-comments rule currently strips JSDoc from `packages/sdk`, so
  consumers lose IDE hovers. Decide whether the published SDK gets an exemption.
- **Redis as a hard dependency.** Rate limiting and the permission cache assume it. Worth deciding
  whether a single-node deployment may run without it.
- **`oidc-provider` on Deno.** It imports and runs but warns "Unsupported runtime". Needs a real
  load test before the OIDC provider surface is promised.
- **Realm-level configuration.** Password policy, session lifetimes and token TTLs are global today;
  they probably belong in `auth.realms.settings`.
