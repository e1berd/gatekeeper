---
title: HTTP hooks
description: Подписанные webhooks для решений и внешних эффектов.
---

HTTP hook получает подписанный HMAC-SHA-256 POST с `event` и `payload`. Проверяйте подпись и
дедуплицируйте доставку. Blocking hook может отклонить flow, after-события надёжно повторяются из
outbox и не удерживают исходную транзакцию.
