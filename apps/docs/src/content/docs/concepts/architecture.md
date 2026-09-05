---
title: Architecture
description: One contract, three HTTP surfaces, and three PostgreSQL schemas.
---

`packages/contract` is the source of truth for the API. It contains definitions only: no database
access and no server logic. The server and SDK both depend on it, so contract changes are visible to
every caller at type-check time.

| Surface | Path      | Intended consumer                                                            |
| ------- | --------- | ---------------------------------------------------------------------------- |
| RPC     | `/rpc/*`  | The JavaScript SDK; preserves JavaScript values such as `Date` and `bigint`. |
| REST    | `/api/*`  | Non-TypeScript clients and generated clients.                                |
| Forms   | `/form/*` | Browser navigation with plain HTML forms and cookies.                        |

Standards endpoints such as JWKS, OpenID discovery, SAML ACS, and OAuth callbacks are direct HTTP
routes because external providers reach them by URL.

PostgreSQL schemas separate concerns without reserving the host application's `public` schema:

- `auth` holds identity, credentials, sessions, keys, and flows.
- `rbac` holds organizations, roles, scopes, grants, and entitlements.
- `audit` holds the append-only security trail.
