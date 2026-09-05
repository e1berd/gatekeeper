---
title: Resource servers
description: Protect an application with locally verified Gatekeeper access tokens.
---

A resource server retrieves the realm's JWKS, caches it, and verifies incoming access tokens
locally. It should validate the issuer, audience, signature, time claims, and the application
authorization model before accepting a request. Calling Gatekeeper for every authenticated request
turns the identity service into a hot-path dependency.

Use `sub` as the stable external identifier when creating or finding a local application user. Keep
public routes separate from routes requiring a valid token. Place only authorization facts suitable
for token lifetime in claims; use `authz.check` when a current scoped decision is necessary.

Use the stack-specific guides for Laravel, Node, Django, Spring, and ASP.NET.
