---
title: TOTP and recovery codes
description: Add a second factor and retain a secure recovery path.
---

Start with `mfa.totpEnroll`, render the provisioning URI as a QR code, and confirm it through
`mfa.totpVerify`. The seed is envelope-encrypted at rest. Generate recovery codes once, show them
once, and store them offline; Gatekeeper stores hashes and consumes each code on use.

`mfa.verifyChallenge` completes an MFA challenge. `mfa.stepUp` raises the existing session to `aal2`
without a full login.
