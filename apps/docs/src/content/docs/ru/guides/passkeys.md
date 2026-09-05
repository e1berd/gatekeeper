---
title: Passkeys
description: Регистрация и аутентификация WebAuthn credentials.
---

Получите `passkey.registerOptions`, вызовите WebAuthn API браузера и передайте ответ в
`passkey.registerVerify`. Аналогично устроена аутентификация. Discoverable credentials позволяют
вход без имени пользователя; credential ID уникальны, а регресс счётчика signature обнаруживается.
