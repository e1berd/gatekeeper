---
title: Deployment
description: Run Gatekeeper behind a reverse proxy without weakening its controls.
---

The production image is built from the repository-root `Dockerfile`. `docker compose up -d --build`
starts the API after PostgreSQL is healthy and migrations have completed.

Set `GATEKEEPER_ISSUER` to the public HTTPS URL. When Gatekeeper is behind a reverse proxy, enable
`TRUST_PROXY=true` only if the proxy removes inbound `X-Forwarded-For` headers and writes its own.
Trusting that header from arbitrary clients makes per-IP controls bypassable.

If applications and Gatekeeper need a shared cookie across subdomains, configure `COOKIE_DOMAIN`
deliberately and use HTTPS. Keep the redirect, form-origin, and CORS allowlists as narrow as the
actual deployment permits.

The docs site is static. Build it with `deno task docs:build`; publish `apps/docs/dist` from the
same container or a CDN. That task regenerates `apps/docs/public/openapi.json` first.
