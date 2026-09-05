---
title: Hooks
description: Расширяйте identity-flow, не перенося продуктовую логику в Gatekeeper.
---

`sql` hook запускается внутри транзакции и нужен для атомарных эффектов, например создания workspace
вместе с регистрацией. `http` hook используется для внешних эффектов: blocking-событие ожидает
ответ, а after-событие попадает в outbox и повторяется с экспоненциальной задержкой.

Поддерживаются `before_sign_up`, `after_sign_up`, `before_sign_in`, `after_sign_in`,
`before_token_issue`, события организаций и приглашений, а также `before_password_change`.
