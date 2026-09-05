---
title: Ротация ключей
description: Ротация signing и encryption ключей без перерыва проверки.
---

Создайте новый active signing key realm, опубликуйте его в JWKS и сохраняйте старые public keys до
истечения всех подписанных ими токенов. KEK ротируется rewrap-операцией над DEK из
`auth.encryption_keys`, без массовой расшифровки прикладных секретов.
