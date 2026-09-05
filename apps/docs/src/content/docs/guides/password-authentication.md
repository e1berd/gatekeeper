---
title: Password authentication
description: Password sign-up, sign-in, verification, reset, and change flows.
---

Use `auth.signUp` and `auth.signInPassword` for email-password identities. The realm policy controls
allowed domains and verification requirements. Passwords use Argon2id and are rehashed after a
successful login when policy parameters change. Unknown users and invalid passwords have identical
responses and timing; repeated failures trigger exponential lockout.

Verification, reset, and OTP tokens are hashed, single-use, and expiry-bound. Changing a password
requires an authenticated, stepped-up session when the realm policy demands it.
