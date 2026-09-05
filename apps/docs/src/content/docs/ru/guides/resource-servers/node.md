---
title: Express и Fastify
description: JWT middleware для Node.js resource server.
---

В Express middleware или Fastify `preHandler` используйте `jose` и кешируемый JWKS. Проверяйте
`iss`, `aud`, `exp`, `nbf`, сохраняйте verified payload в request и привязывайте локального
пользователя к `sub`. Public routes оставьте вне middleware.
