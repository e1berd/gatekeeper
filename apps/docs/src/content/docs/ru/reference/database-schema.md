---
title: Схема базы данных
description: Данные идентичности, авторизации и аудита в отдельных схемах PostgreSQL.
---

`auth` содержит realms, пользователей, identities, credentials, sessions, refresh token, ключи и
hook deliveries. `rbac` содержит организации, роли, permissions, scoped grants, наследование и
entitlements. `audit.log` — compliance trail с отдельным partitioned retention.
