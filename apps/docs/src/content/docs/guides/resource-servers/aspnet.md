---
title: ASP.NET
description: Validate Gatekeeper access tokens with ASP.NET Core.
---

Configure `AddJwtBearer` with the authority, audience, and JWKS-backed signing keys. Map `sub` to
the local principal, use authorization policies for claim-based roles, and protect controllers or
minimal API endpoints with `[Authorize]`. Refresh cookie-backed SSR sessions in server code, not
JavaScript.
