---
title: Окружение
description: Конфигурация сервера через переменные окружения.
---

Обязательны `DATABASE_URL` и `GATEKEEPER_KEK`. `GATEKEEPER_ISSUER` задаёт публичный URL, `REDIS_URL`
подключает общий кеш и rate-limit, `SMTP_URL` — транспорт почты. `WEBAUTHN_RP_ID` и
`WEBAUTHN_ORIGINS` должны соответствовать браузерному домену. Списки redirect, form и CORS origin
держите минимальными; `TRUST_PROXY=true` включайте только за доверенным reverse proxy.
