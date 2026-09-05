---
title: Passkeys
description: Register and authenticate WebAuthn credentials.
---

Call `passkey.registerOptions`, pass options to the browser WebAuthn API, then submit its response
to `passkey.registerVerify`. Authentication follows the same options-and-verify ceremony.
Discoverable credentials enable usernameless sign-in. Credential IDs are unique, sign-counter
regressions are detected, and operators may enforce FIDO metadata and AAGUID policy.
