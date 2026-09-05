---
title: Resource servers
description: Защищайте приложение локальной проверкой access token Gatekeeper.
---

Resource server кеширует JWKS и локально проверяет подпись, issuer, audience и временные claims. Не
вызывайте Gatekeeper на каждом запросе: это превращает identity-сервис в зависимость горячего пути.
Используйте `sub` как постоянный внешний ID для JIT provisioning, а `authz.check` — когда нужно
актуальное scoped-решение.
