---
title: REST API
description: Сгенерированный контракт OpenAPI 3.1.
---

REST-контракт генерируется из `packages/contract` при `deno task docs:build`. Его точная версия
доступна как [openapi.json](/openapi.json). REST расположен под `/api/*`; realm передаётся в
`X-Gatekeeper-Realm`, access token — в `Authorization: Bearer <token>`.
