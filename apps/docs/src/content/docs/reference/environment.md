---
title: Environment
description: Server configuration from environment variables.
---

| Variable                   | Default                     | Purpose                                    |
| -------------------------- | --------------------------- | ------------------------------------------ |
| `DATABASE_URL`             | required                    | PostgreSQL connection string.              |
| `GATEKEEPER_KEK`           | required                    | Key-encryption key for encrypted secrets.  |
| `GATEKEEPER_PORT`          | `8080`                      | HTTP listener port.                        |
| `GATEKEEPER_ISSUER`        | `http://localhost:8080`     | Public issuer URL.                         |
| `GATEKEEPER_SIGNING_KEY`   | unset                       | Bootstrap signing-key material.            |
| `DATABASE_POOL_MAX`        | `10`                        | PostgreSQL connection-pool limit.          |
| `REDIS_URL`                | unset                       | Shared Redis for rate limits and caching.  |
| `SMTP_URL`                 | empty                       | SMTP transport URL.                        |
| `MAIL_FROM`                | `no-reply@gatekeeper.local` | Default sender address.                    |
| `WEBAUTHN_RP_ID`           | `localhost`                 | WebAuthn relying-party ID.                 |
| `WEBAUTHN_RP_NAME`         | `Gatekeeper`                | WebAuthn relying-party name.               |
| `WEBAUTHN_ORIGINS`         | `http://localhost:8080`     | Comma-separated accepted WebAuthn origins. |
| `COOKIE_DOMAIN`            | unset                       | Shared cookie domain, when needed.         |
| `ALLOWED_REDIRECT_ORIGINS` | issuer origin               | Comma-separated form redirect allowlist.   |
| `ALLOWED_FORM_ORIGINS`     | issuer origin               | Comma-separated CSRF origin allowlist.     |
| `CORS_ALLOWED_ORIGINS`     | issuer origin               | Comma-separated REST/RPC CORS allowlist.   |
| `TRUST_PROXY`              | `false`                     | Trust `X-Forwarded-For` only when `true`.  |
| `LOG_LEVEL`                | `info`                      | Server log level.                          |
| `GATEKEEPER_VERSION`       | `0.1.0`                     | Version exposed by the server.             |

Keep `GATEKEEPER_KEK` and signing material in a secret manager, never in the repository or logs.
