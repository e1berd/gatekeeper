---
title: Database schema
description: Identity, authorization, and audit data in separate PostgreSQL schemas.
---

`auth` contains realms, users, identities, credentials, sessions, refresh tokens, encryption keys,
signing keys, one-time tokens, and hook deliveries. `rbac` contains organizations, roles,
permissions, scoped grants, role inheritance, and entitlements. `audit.log` is the compliance trail
and is retained on its own partitioned schedule.
