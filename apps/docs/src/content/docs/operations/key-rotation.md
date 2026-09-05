---
title: Key rotation
description: Rotate signing and encryption keys without interrupting verification.
---

Create a new active signing key for the realm, publish it in JWKS, and keep previous public keys
until every token they signed has expired. Rotate the KEK by rewrapping DEKs in
`auth.encryption_keys`; application secrets remain encrypted with their DEK and need not all be
rewritten at once.
