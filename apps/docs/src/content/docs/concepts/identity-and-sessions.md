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

Access tokens are intended to be short lived and verified by resource servers through published
JWKS. Refresh tokens are opaque: only their SHA-256 hashes are stored. Each refresh rotates the
token; reuse of a spent token revokes the whole session family.

The exact signing implementation and token claim shape are still MVP work. Do not rely on the
scaffold's token endpoints until that milestone is complete.
