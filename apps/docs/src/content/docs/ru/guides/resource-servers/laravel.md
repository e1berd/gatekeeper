---
title: Laravel
description: Защита Laravel-маршрутов локальной проверкой JWT Gatekeeper.
---

Кешируйте JWKS, библиотекой JWT проверяйте issuer, audience, подпись и время, затем сопоставляйте
`sub` локальному пользователю. Middleware ставьте только на защищённые маршруты. Обновляйте SSR
cookie на сервере, а `authz.check` вызывайте для актуального scoped-решения.
