---
title: Spring
description: Configure Spring Security as a Gatekeeper resource server.
---

Configure the JWT decoder with the realm `issuer-uri` or `jwk-set-uri` and add an audience
validator. Map `sub` to the application principal and translate stable role claims to authorities.
Permit public paths explicitly; protect the rest with the security chain. Call `authz.check` for
live, resource-scoped authorization.
