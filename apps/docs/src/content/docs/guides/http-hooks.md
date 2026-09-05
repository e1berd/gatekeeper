---
title: HTTP hooks
description: Receive signed webhooks for decisions and side effects.
---

HTTP hooks receive a signed `POST` body with `event` and `payload`. Verify its HMAC-SHA-256
signature and deduplicate delivery. Blocking hooks may deny a flow; after-events enter the retrying
outbox and never hold the original database transaction open.
