---
title: Configuration
description: Configure the complete Gatekeeper service with a validated YAML file.
---

Gatekeeper reads `gatekeeper.yaml` from the working directory. Select another file for the server,
OpenAPI generator, or migration command with either `--config path/to/config.yaml` or
`--config=path/to/config.yaml`.

Start from the tracked example:

```sh
cp gatekeeper.example.yaml gatekeeper.yaml
openssl rand -base64 32
```

Put the generated value in `security.kek`. The local file is ignored by Git. In production, mount it
read-only from your deployment secret store and restrict who can read it.

The schema is strict. Unknown keys, invalid URLs and provider-specific mistakes stop Gatekeeper at
startup instead of silently falling back to another setting.

## Complete example

```yaml
server:
  port: 8080
  issuer: https://id.example.com
  logLevel: info
  version: 0.1.0

database:
  url: postgres://gatekeeper:password@postgres:5432/gatekeeper
  poolMax: 10

redis:
  url: redis://redis:6379

security:
  kek: base64-encoded-key-encryption-key
  signingKey: null

browser:
  cookieDomain: .example.com
  allowedRedirectOrigins: [https://app.example.com]
  allowedFormOrigins: [https://app.example.com]
  corsAllowedOrigins: [https://app.example.com]
  trustProxy: true

webauthn:
  rpId: example.com
  rpName: Example
  origins: [https://app.example.com, https://id.example.com]

mail:
  smtpUrl: smtp://mail:1025
  from: no-reply@example.com

s3:
  endpoint: null
  region: us-east-1
  accessKeyId: ''
  secretAccessKey: ''
  avatarBucket: gatekeeper-avatars
  publicUrl: null
  pathStyle: true

humanVerification:
  provider: disabled
  actions: []
  hostnames: []
  timeoutMs: 5000
```

`database.url` and `security.kek` are required. If an origin list is omitted, it defaults to the
origin of `server.issuer`. Set `redis.url` to `null` to use the in-process store on one server.
`security.signingKey`, `browser.cookieDomain`, and optional S3 URLs accept `null`.

Human verification supports `turnstile`, `hcaptcha`, `recaptcha`, and `altcha`. Provider-specific
examples and client integration are in [Human verification](../guides/human-verification/).

## Container deployment

The Compose services mount `./gatekeeper.yaml` at `/app/gatekeeper.yaml` for both migrations and the
API. Keep the database URL in that file aligned with the Compose network hostname. No Gatekeeper
environment variables are required.
