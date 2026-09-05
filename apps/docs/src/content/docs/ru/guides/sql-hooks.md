---
title: SQL hooks
description: Расширение flow внутри транзакции Gatekeeper.
---

Target — квалифицированная PostgreSQL-функция `jsonb → jsonb`. Верните
`{"decision":"deny","code":"FORBIDDEN"}` для отказа или allow с claims и patch. Выдавайте функции
только необходимые права базы данных.
