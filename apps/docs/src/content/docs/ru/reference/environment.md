---
title: Конфигурация
description: Настройка всего сервиса Gatekeeper через проверяемый YAML-файл.
---

Gatekeeper читает `gatekeeper.yaml` из рабочей директории. Другой файл можно передать серверу,
генератору OpenAPI или команде миграции как `--config path/to/config.yaml` либо
`--config=path/to/config.yaml`.

Начните с примера в репозитории:

```sh
cp gatekeeper.example.yaml gatekeeper.yaml
openssl rand -base64 32
```

Запишите полученное значение в `security.kek`. Локальный файл исключён из Git. В production
монтируйте его read-only из secret store и ограничьте права чтения.

Схема строгая: неизвестные поля, некорректные URL и ошибки в настройках провайдера останавливают
запуск Gatekeeper, а не приводят к неявному fallback.

## Полный пример

```yaml
server:
  port: 8080
  issuer: https://id.example.com
  logLevel: info
  version: 0.1.0

database:
  url: postgres://gatekeeper:password@postgres:5432/gatekeeper
  poolMax: 10

redis:
  url: redis://redis:6379

security:
  kek: base64-encoded-key-encryption-key
  signingKey: null

browser:
  cookieDomain: .example.com
  allowedRedirectOrigins: [https://app.example.com]
  allowedFormOrigins: [https://app.example.com]
  corsAllowedOrigins: [https://app.example.com]
  trustProxy: true

webauthn:
  rpId: example.com
  rpName: Example
  origins: [https://app.example.com, https://id.example.com]

mail:
  smtpUrl: smtp://mail:1025
  from: no-reply@example.com

s3:
  endpoint: null
  region: us-east-1
  accessKeyId: ''
  secretAccessKey: ''
  avatarBucket: gatekeeper-avatars
  publicUrl: null
  pathStyle: true

humanVerification:
  provider: disabled
  actions: []
  hostnames: []
  timeoutMs: 5000
```

`database.url` и `security.kek` обязательны. Если список origin не указан, используется origin из
`server.issuer`. Для одного экземпляра сервера задайте `redis.url: null`, чтобы использовать
in-process store. Поля `security.signingKey`, `browser.cookieDomain` и опциональные S3 URL принимают
`null`.

Проверка человека поддерживает `turnstile`, `hcaptcha`, `recaptcha` и `altcha`. Настройки каждого
провайдера и интеграция клиента описаны в разделе
[Проверка человека](../guides/human-verification/).

## Запуск в контейнерах

Compose монтирует `./gatekeeper.yaml` как `/app/gatekeeper.yaml` и для миграций, и для API. URL базы
данных в файле должен использовать hostname из сети Compose. Переменные окружения Gatekeeper не
нужны.
