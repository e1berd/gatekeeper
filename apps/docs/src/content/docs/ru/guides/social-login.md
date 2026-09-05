---
title: Социальный вход
description: Google и GitHub с PKCE.
---

`auth.oauthStart` запускает PKCE-flow Google или GitHub, а `auth.oauthExchange` завершает его
обычным результатом аутентификации. Совпадающий подтверждённый email добавляет идентичность к
существующему пользователю, а не создаёт дубликат.
