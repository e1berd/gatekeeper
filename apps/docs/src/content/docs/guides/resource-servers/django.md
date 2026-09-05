---
title: Django
description: Protect Django views using Gatekeeper JWKS.
---

Implement authentication middleware or a Django REST Framework authentication class that caches JWKS
and validates issuer, audience, signature, and time claims. Find or create the local user by `sub`,
not email. Decorate protected views, leave public views unwrapped, and perform cookie refresh inside
the server-side request cycle.
