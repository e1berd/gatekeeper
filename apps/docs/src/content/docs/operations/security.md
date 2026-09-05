---
title: Security
description: Security boundaries, deployment responsibilities, and reporting.
---

Gatekeeper protects password credentials, cookie sessions, refresh tokens, encrypted application
secrets, and authorization decisions. Passwords use Argon2id; TOTP seeds, SSO client secrets, and
SAML keys use envelope encryption; refresh tokens rotate on every use; and resource servers verify
JWTs locally through JWKS.

Deployment still matters. Use TLS, protect the database and encryption key, restrict trusted proxy
headers, validate every configured origin, and never log passwords, tokens, secrets, or full
authorization headers. Backups must include the data and the ability to recover the corresponding
key-encryption material.

To report a vulnerability, contact the project maintainers privately rather than opening a public
issue with exploitable details.
