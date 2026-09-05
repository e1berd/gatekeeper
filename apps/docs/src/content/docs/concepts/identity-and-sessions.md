---
title: Identity and sessions
description: Realms isolate data; sessions and tokens carry an authentication level.
---

A realm is Gatekeeper's isolation boundary. Every relevant record carries a realm identifier, so a
single deployment can host separate products and environments without mixing their identities.

A user may have several identities, such as a password and a social account. Linking a second
provider for an existing email creates another identity instead of another user.

Sessions record their authentication assurance level (AAL) and authentication methods (AMR). A
sensitive action can require `aal2`, prompting a step-up rather than ending the user's session.

Access tokens are short lived and signed with the realm's active key. Resource servers verify them
through published JWKS. Refresh tokens are opaque: only their SHA-256 hashes are stored. Each
refresh rotates the token; reuse of a spent token revokes the whole session family.

Every access token contains the standard `iss`, `aud`, `exp`, and `nbf` claims plus `sub`, `sid`,
`realm`, `aal`, `amr`, `org`, `roles`, `pv`, and `act`. `aud` is application-specific, preventing a
token minted for one resource server from being replayed against another. `pv` is the user's
permissions version, and `act` identifies the original actor during an impersonated session.

Sessions expire on two clocks: idle expiry advances on refresh, while an optional absolute expiry
never moves. Signing out locally revokes one session; global sign-out revokes every active session.
