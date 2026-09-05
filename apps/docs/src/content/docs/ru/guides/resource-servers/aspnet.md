---
title: ASP.NET
description: Проверка access token Gatekeeper в ASP.NET Core.
---

Настройте `AddJwtBearer` с authority, audience и JWKS signing keys. Сопоставляйте `sub` principal,
используйте policies для ролей claims и `[Authorize]` для controllers или minimal API. SSR cookie
обновляйте в серверном коде.
