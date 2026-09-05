---
title: Django
description: Защита Django views с JWKS Gatekeeper.
---

Реализуйте middleware или DRF authentication class, кеширующий JWKS и проверяющий claims. Находите
или создавайте локального пользователя по `sub`, а не email. Защищайте views декораторами и
обновляйте SSR cookie внутри серверного request cycle.
