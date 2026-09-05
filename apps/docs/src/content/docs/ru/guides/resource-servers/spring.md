---
title: Spring
description: Настройка Spring Security как Gatekeeper resource server.
---

Настройте JWT decoder через `issuer-uri` или `jwk-set-uri` и добавьте audience validator.
Сопоставляйте `sub` application principal, а claims ролей — authorities. Public paths разрешайте
явно, актуальную resource-scoped авторизацию выполняйте через `authz.check`.
