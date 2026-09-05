---
title: SQL hooks
description: Extend a flow inside Gatekeeper's transaction.
---

The target is a qualified PostgreSQL function accepting and returning `jsonb`. Return
`{"decision":"deny","code":"FORBIDDEN"}` to reject a flow or an allow decision with optional claims
and patches. Grant the function only the database privileges it needs.
