---
title: Развёртывание
description: Production-развёртывание за reverse proxy.
---

Соберите production image корневым `Dockerfile` и запустите `docker compose up -d --build`.
`GATEKEEPER_ISSUER` должен быть публичным HTTPS URL. Включайте `TRUST_PROXY=true` только если proxy
стирает входящий `X-Forwarded-For` и устанавливает собственный. Статический сайт собирается
`deno task docs:build` в `apps/docs/dist`.
