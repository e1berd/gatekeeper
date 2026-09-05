---
title: Проверка человека
description: Защита анонимных auth-операций через CAPTCHA или ALTCHA Sentinel.
---

Gatekeeper может требовать токен провайдера перед выбранными анонимными auth-операциями. Одна
политика действует для RPC, REST, SDK и HTML-форм. По умолчанию проверка выключена.

Поддерживаются Cloudflare Turnstile, hCaptcha, Google reCAPTCHA v3 и ALTCHA Sentinel. Секрет
остаётся на сервере. `humanVerification.config` возвращает только публичный site key или URL
challenge ALTCHA, список защищённых действий и имя поля формы.

## Какие операции можно защитить

| Action             | Процедура                   | Назначение                      |
| ------------------ | --------------------------- | ------------------------------- |
| `sign_up`          | `auth.signUp`               | Защита от массовых регистраций  |
| `sign_in_password` | `auth.signInPassword`       | Защита password login           |
| `sign_in_otp`      | `auth.signInOtp`            | Защита от массовой рассылки OTP |
| `password_reset`   | `auth.requestPasswordReset` | Защита reset-писем              |

CAPTCHA дополняет rate limit и account lockout, но не заменяет их.

## Полная конфигурация

### Turnstile и hCaptcha

```yaml
humanVerification:
  provider: turnstile
  actions: [sign_up, sign_in_password, sign_in_otp, password_reset]
  hostnames: [id.example.com]
  siteKey: public-site-key
  secret: server-secret
  timeoutMs: 5000
```

Для hCaptcha замените provider на `hcaptcha`.

### reCAPTCHA v3

```yaml
humanVerification:
  provider: recaptcha
  actions: [sign_up, sign_in_password]
  hostnames: [id.example.com]
  siteKey: public-site-key
  secret: server-secret
  minimumScore: 0.5
  timeoutMs: 5000
```

Gatekeeper ожидает score, поэтому для `recaptcha` нужен ключ reCAPTCHA v3. Ответ со score ниже
`minimumScore` отклоняется.

### ALTCHA Sentinel

```yaml
humanVerification:
  provider: altcha
  actions: [sign_up, sign_in_password]
  hostnames: []
  secret: sentinel-api-key-secret
  timeoutMs: 5000
  challengeUrl: https://sentinel.example.com/v1/challenge?apiKey=key_public
  verifyUrl: https://sentinel.example.com/v1/verify/signature
```

`challengeUrl` публичен и возвращается браузеру. `secret` остаётся только на сервере.

При `provider: disabled` список actions должен быть пустым. Gatekeeper не запустится с неизвестным
provider/action или некорректным URL, timeout и score.

## Обнаружение провайдера в клиенте

Приложению не нужно дублировать deployment-конфигурацию:

```ts
const gatekeeper = new Gatekeeper(new URL('https://id.example.com'))
const verification = await gatekeeper.humanVerification.config()

const action = 'sign_in_password'
const isRequired = verification.protectedActions.includes(action)
```

REST-эквивалент — `GET /api/human-verification/config`. Ответ для Turnstile, hCaptcha и reCAPTCHA:

```json
{
  "protectedActions": ["sign_up", "sign_in_password"],
  "fieldName": "human_verification",
  "provider": {
    "provider": "turnstile",
    "siteKey": "public-site-key"
  }
}
```

Для ALTCHA в `provider` приходит `challengeUrl` вместо `siteKey`.

## SDK и RPC

Поле `humanVerification` доступно во всех защищаемых процедурах:

```ts
await gatekeeper.auth.signUp({ email, password, humanVerification: widgetToken })
await gatekeeper.auth.signIn({ email, password, humanVerification: widgetToken })
await gatekeeper.auth.requestOtp({
  channel: 'email',
  identifier: email,
  humanVerification: widgetToken,
})
await gatekeeper.auth.requestPasswordReset({ email, humanVerification: widgetToken })
```

Для каждой повторной попытки получайте новый proof. Не сохраняйте proof в local storage и не
логируйте его.

## REST API

```sh
curl https://id.example.com/api/auth/sign-in/password \
  --request POST \
  --header 'content-type: application/json' \
  --header 'x-gatekeeper-realm: production' \
  --data '{
    "email": "user@example.com",
    "password": "correct horse battery staple",
    "humanVerification": "provider-token"
  }'
```

В OpenAPI поле опционально, так как actions задаются на deployment. Для защищённого action сервер
потребует proof в runtime.

## Виджеты в HTML-формах

Добавьте origin страницы в `browser.allowedFormOrigins`. Остальные поля формы и redirect-правила
описаны в гайде [HTML-формы](./html-forms/).

### Turnstile

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<form method="post" action="https://id.example.com/form/sign-in">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <div
    class="cf-turnstile"
    data-sitekey="public-site-key"
    data-action="sign_in_password"
  ></div>
  <button type="submit">Войти</button>
</form>
```

Turnstile сам добавляет `cf-turnstile-response`. `data-action` должен совпадать с action Gatekeeper.

### hCaptcha

```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>

<form method="post" action="https://id.example.com/form/sign-up">
  <input name="email" type="email" required />
  <input name="password" type="password" minlength="8" required />
  <div class="h-captcha" data-sitekey="public-site-key"></div>
  <button type="submit">Зарегистрироваться</button>
</form>
```

### reCAPTCHA v3

```html
<script src="https://www.google.com/recaptcha/api.js?render=public-site-key"></script>

<form id="sign-in" method="post" action="https://id.example.com/form/sign-in">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <data name="human_verification"></data>
  <button type="submit">Войти</button>
</form>

<script>
const form = document.querySelector('#sign-in')

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  await new Promise((resolve) => grecaptcha.ready(resolve))
  form.querySelector('data[name="human_verification"]').value = await grecaptcha.execute(
    'public-site-key',
    {
      action: 'sign_in_password',
    },
  )
  form.submit()
})
</script>
```

### ALTCHA Sentinel

```html
<script
  src="https://cdn.jsdelivr.net/gh/altcha-org/altcha/dist/main/altcha.min.js"
  type="module"
  async
  defer
></script>

<form method="post" action="https://id.example.com/form/sign-in">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <altcha-widget
    challenge="https://sentinel.example.com/v1/challenge?apiKey=key_public"
    name="altcha"
  ></altcha-widget>
  <button type="submit">Войти</button>
</form>
```

В production зафиксируйте версию скрипта ALTCHA или отдавайте его со своего origin. ALTCHA вне
localhost требует HTTPS.

## Ошибки и retry

| RPC / REST                       | `/form/*`                        | Значение             |
| -------------------------------- | -------------------------------- | -------------------- |
| `HUMAN_VERIFICATION_REQUIRED`    | `human_verification_required`    | Proof не передан     |
| `HUMAN_VERIFICATION_FAILED`      | `human_verification_failed`      | Proof отклонён       |
| `HUMAN_VERIFICATION_UNAVAILABLE` | `human_verification_unavailable` | Провайдер недоступен |

При недоступности провайдера Gatekeeper работает fail closed: auth-операция не выполняется.
`/form/*` добавляет код в `?error=`, RPC и REST возвращают типизированную oRPC-ошибку.

## Production checklist

- Храните `humanVerification.secret` в secret manager и не передавайте его в браузер.
- Задайте `humanVerification.hostnames` для production-доменов.
- Связывайте Turnstile и reCAPTCHA proof с action.
- Отдавайте auth-формы и виджеты по HTTPS.
- Не логируйте proof, provider secret и полные auth-запросы.
- Не заменяйте CAPTCHA rate limit, lockout, CSRF и email verification.

Официальные инструкции: [Turnstile](https://developers.cloudflare.com/turnstile/),
[hCaptcha](https://docs.hcaptcha.com/),
[reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) и
[ALTCHA](https://altcha.org/docs/integration/widget/).
