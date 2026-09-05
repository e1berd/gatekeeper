---
title: Laravel
description: Protect Laravel routes with locally verified Gatekeeper JWTs.
---

Cache the realm JWKS in Laravel, verify issuer, audience, signature, and time claims with a JWT
library, then map `sub` to a local user. Apply middleware only to protected routes. Keep cookie
refresh server-side: exchange the refresh cookie with Gatekeeper before rendering, never expose it
to browser JavaScript. Use claims for stable roles and `authz.check` for a current scoped decision.
