---
title: Security
description: Security boundaries, deployment responsibilities, and reporting.
---

Gatekeeper is designed to protect password credentials, cookie sessions, refresh tokens, encrypted
application secrets, and authorization decisions. Its planned security properties include Argon2id
password hashing, encrypted secrets at rest, rotating opaque refresh tokens, and local JWT
verification through JWKS.

Deployment still matters. Use TLS, protect the database and encryption key, restrict trusted proxy
headers, validate every configured origin, and never log passwords, tokens, secrets, or full
authorization headers. Backups must include the data and the ability to recover the corresponding
key-encryption material.

The planned crypto and token milestones are not implemented in this scaffold. Treat the existing
server as development-only until those milestones and tests are complete.

To report a vulnerability, contact the project maintainers privately rather than opening a public
issue with exploitable details.
