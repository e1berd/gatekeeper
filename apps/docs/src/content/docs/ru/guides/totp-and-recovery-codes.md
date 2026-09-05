---
title: TOTP и recovery codes
description: Подключение второго фактора и безопасное восстановление доступа.
---

`mfa.totpEnroll` выдаёт provisioning URI, который нужно показать QR-кодом, а `mfa.totpVerify`
подтверждает код. Seed шифруется в базе. Recovery codes выдаются один раз, хранятся пользователем
офлайн и в Gatekeeper существуют только как одноразовые хеши. `mfa.stepUp` поднимает сессию до
`aal2`.
