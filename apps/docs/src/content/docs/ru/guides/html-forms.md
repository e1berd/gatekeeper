---
title: HTML-формы
description: Браузерная аутентификация без клиентского JavaScript.
---

Поверхность `/form/*` предназначена для страниц, которые отправляют обычную HTML-форму и не
выполняют JavaScript. Gatekeeper обрабатывает отправку, устанавливает `HttpOnly`-cookie сессии и
отвечает `303 See Other`, чтобы обновление страницы не отправило учётные данные повторно.

Принимается только `POST`; любой другой метод возвращает `405`. Каждый ответ — это редирект без
тела.

## Эндпоинты

| Эндпоинт              | Действие                                     |
| --------------------- | -------------------------------------------- |
| `POST /form/sign-up`  | Создать парольную учётную запись и войти     |
| `POST /form/sign-in`  | Войти по существующему паролю                |
| `POST /form/sign-out` | Отозвать текущую сессию и очистить её cookie |

Любой другой путь под `/form/` возвращает `404`. Эндпоинты `verify-email`, `reset-password`,
`accept-invitation` и `mfa-challenge` запланированы (M8) и пока не подключены.

## Поля

Каждое значение — это поле формы, а не заголовок и не параметр строки запроса.

| Поле                | Обязательно       | Значение                                                |
| ------------------- | ----------------- | ------------------------------------------------------- |
| `email`             | да                | Email учётной записи                                    |
| `password`          | да                | Открытый текст поверх TLS; никогда не логируется        |
| `redirect_to`       | нет               | Куда отправить браузер при успехе                       |
| `error_redirect_to` | нет               | Куда отправить при ошибке; запасной вариант — `Referer` |
| `mfa_redirect_to`   | нет               | Куда отправить, когда требуется второй фактор           |
| `csrf`              | если нет `Origin` | Подписанный токен — для клиентов без заголовка `Origin` |

`redirect_to`, `error_redirect_to` и `mfa_redirect_to` проверяются по
`browser.allowedRedirectOrigins`. Цель вне списка молча заменяется на issuer, поэтому endpoint
идентификации нельзя превратить в открытый редирект.

## Минимальная форма входа

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <data name="redirect_to" value="https://app.example.com/"></data>
  <data name="error_redirect_to" value="https://app.example.com/login"></data>
  <input name="email" type="email" autocomplete="username" required />
  <input name="password" type="password" autocomplete="current-password" required />
  <button type="submit">Войти</button>
</form>
```

При успехе браузер попадает на `redirect_to` с установленными `gk_at` и `gk_rt`. При ошибке — на
`error_redirect_to` с добавленным `?error=<код>` и без cookie.

## Регистрация и выход

```html
<form method="post" action="https://id.example.com/form/sign-up">
  <data name="redirect_to" value="https://app.example.com/welcome"></data>
  <data name="error_redirect_to" value="https://app.example.com/register"></data>
  <input name="email" type="email" autocomplete="email" required />
  <input name="password" type="password" autocomplete="new-password" minlength="8" required />
  <button type="submit">Создать аккаунт</button>
</form>

<form method="post" action="https://id.example.com/form/sign-out">
  <data name="redirect_to" value="https://app.example.com/goodbye"></data>
  <button type="submit">Выйти</button>
</form>
```

Браузерный `minlength` — лишь удобство. Парольная политика realm применяется на сервере, и более
слабый пароль всё равно будет отклонён — см. [Ошибки валидации](#ошибки-валидации).

## Cookie

Успешный вход или регистрация устанавливают следующее на домене из `browser.cookieDomain`:

| Cookie    | Содержимое             | Срок жизни                     |
| --------- | ---------------------- | ------------------------------ |
| `gk_at`   | Access-токен           | realm `tokens.accessTokenTtl`  |
| `gk_rt`   | Refresh-токен          | realm `tokens.refreshTokenTtl` |
| `gk_csrf` | Подписанный CSRF-токен | 1 час                          |
| `gk_mfa`  | Токен MFA-challenge    | 5 минут                        |

Все — `HttpOnly` и `SameSite=Lax`, а также `Secure`, когда issuer работает по `https`. `SameSite` —
вспомогательный контроль, а не защита от CSRF.

## CSRF

`POST` с аутентификацией по cookie требует доказательства, что запрос пришёл с вашей страницы.

1. **Заголовок `Origin`** — сверяется с `browser.allowedFormOrigins`. Браузер отправляет `Origin`
   при каждом `POST` формы, поэтому origin из списка принимается без дополнительных полей. `Origin`,
   который присутствует, но не в списке, отклоняется с `?error=untrusted_origin`.
2. **Подписанный токен** — для клиента, который вообще не отправляет `Origin`, добавьте поле `csrf`
   с токеном, выданным вместе с cookie `gk_csrf`. Отсутствующий или устаревший токен отклоняется с
   `?error=csrf_failed`.

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <data name="csrf" value="{{ csrf_token }}"></data>
  <!-- email, password, redirect_to … -->
</form>
```

Эндпоинт, выдающий `csrf_token` серверно-рендеренной странице, — это работа M8. Пока его нет,
держите отправляющий origin в `browser.allowedFormOrigins` и полагайтесь на проверку `Origin`.

## Выбор realm

Поверхность форм читает realm из заголовка запроса `x-gatekeeper-realm` и по умолчанию использует
`master`. Браузер не может задать этот заголовок, поэтому multi-realm-развёртывание терминирует
каждый realm на своём хосте, а обратный прокси подставляет заголовок. Неизвестный slug отклоняется с
`?error=unknown_realm`.

## Что возвращается

| Исход                            | Редирект                                                         | Cookie           |
| -------------------------------- | ---------------------------------------------------------------- | ---------------- |
| Аутентифицирован                 | `redirect_to`, иначе issuer                                      | `gk_at`, `gk_rt` |
| Требуется второй фактор          | `mfa_redirect_to`, иначе `<issuer>/mfa`                          | `gk_mfa`         |
| Email или телефон не подтверждён | `error_redirect_to` с `?error=verify_email` (или `verify_phone`) | нет              |
| Любая ошибка                     | `error_redirect_to` с `?error=<код>`                             | нет              |

### Чтение ошибки

Ошибка приходит на вашу страницу как код в нижнем регистре в строке запроса — никогда как готовое
предложение. Сопоставьте его со своими текстами на своём языке:

```html
<!-- https://app.example.com/login?error=invalid_credentials -->
<div id="form-error" role="alert"></div>
<script type="module">
const MESSAGES = {
  invalid_credentials: 'Неверная почта или пароль.',
  too_many_requests: 'Слишком много попыток. Подождите и попробуйте снова.',
  email_taken: 'Эта почта уже зарегистрирована.',
  email_not_verified: 'Подтвердите адрес электронной почты, чтобы продолжить.',
  verify_email: 'Проверьте почту, чтобы подтвердить адрес.',
  untrusted_origin: 'Форма отправлена с неизвестного сайта.',
  csrf_failed: 'Сессия истекла. Обновите страницу и попробуйте снова.',
  bad_request: 'Проверьте форму и попробуйте снова.',
}
const code = new URLSearchParams(location.search).get('error')
if (code) {
  document.getElementById('form-error').textContent = MESSAGES[code] ??
    'Что-то пошло не так. Попробуйте снова.'
}
</script>
```

Коды, которые может вернуть поверхность форм:

| Код                              | Причина                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `invalid_credentials`            | Неизвестный аккаунт или неверный пароль — они объединены    |
| `email_taken`                    | Регистрация с уже существующим адресом                      |
| `account_locked`                 | Слишком много неудачных попыток; повторите позже            |
| `email_not_verified`             | Пароль верный, но адрес не подтверждён                      |
| `too_many_requests`              | Достигнут лимит запросов                                    |
| `human_verification_required`    | Нет обязательного proof проверки человека                   |
| `human_verification_failed`      | Провайдер отклонил proof                                    |
| `human_verification_unavailable` | Провайдер недоступен                                        |
| `verify_email` / `verify_phone`  | Для входа сначала нужен подтверждённый адрес или телефон    |
| `bad_request`                    | Ввод не прошёл валидацию — см. ниже                         |
| `untrusted_origin`               | `Origin` присутствует, но не в `browser.allowedFormOrigins` |
| `csrf_failed`                    | Нет `Origin` и нет корректного поля `csrf`                  |
| `unknown_realm`                  | `x-gatekeeper-realm` указывает на несуществующий realm      |
| `internal_error`                 | Непредвиденный сбой сервера                                 |

Структурные данные `data`, которые часть кодов несёт на `/rpc` и `/api` — `retryAfter` для
`too_many_requests`, `until` для `account_locked` — **не** передаются через редирект формы.
Странице, которой они нужны, следует вызывать `/rpc` или `/api`.

## Ошибки валидации

Поверхность форм сообщает о **любом** сбое валидации ввода единственным кодом `bad_request`, без
указания, какое поле не прошло и почему. Этого достаточно, чтобы перерисовать форму с общим
уведомлением, но недостаточно, чтобы подсветить конкретное поле.

Для обратной связи по полям либо валидируйте в браузере до отправки (`type="email"`, `minlength`,
`pattern`), либо отправляйте через `/rpc` или `/api`, которые возвращают полный список issue.

Вход через `/rpc` с помощью SDK:

```ts
import { isDefinedError, safe } from '@orpc/client'
import { Gatekeeper } from '@gatekeeper/sdk'

const gk = new Gatekeeper('https://id.example.com', { realm: 'production' })

const { error, data } = await safe(gk.auth.signIn({ email, password }))

if (!error) {
  // data.status: 'authenticated' | 'mfa_required' | 'verification_required'
} else if (isDefinedError(error) && error.code === 'INVALID_CREDENTIALS') {
  show(t('auth.INVALID_CREDENTIALS'))
} else if (isDefinedError(error) && error.code === 'TOO_MANY_REQUESTS') {
  show(t('auth.TOO_MANY_REQUESTS', { seconds: error.data.retryAfter }))
} else if (error.code === 'BAD_REQUEST') {
  for (const issue of error.data.issues) {
    // issue.path -> ['email'] | ['password'];  issue.code -> 'invalid_format' | 'too_small'
    markField(issue.path.join('.'), t(`validation.${issue.code}`))
  }
}
```

`error.code === 'BAD_REQUEST'` — это ошибка валидации ввода oRPC. Её `data.issues` — массив issue по
Standard Schema: у каждого элемента есть `path` до поля и машинный `code` (`invalid_format`,
`too_small`, `invalid_type`, …). Контракт не задаёт человекочитаемых сообщений в своих схемах,
поэтому `issue.message` — запасной вариант для разработчика; стройте свои тексты по `issue.code` и
`issue.path`.

`isDefinedError` сужает `error` до кодов, объявленных процедурой в контракте; именно там
`error.data` становится типизированным (`retryAfter`, `requiredAal`). `BAD_REQUEST` не объявленный
код, поэтому его `data` — `unknown`, и `issues` вы читаете напрямую.

Модель, стоящая за этим, описана в разделе [Ошибки и локализация](/ru/concepts/errors/).

## Текущее состояние

Роутер `/form/*`, проверки CSRF, защита от открытого редиректа и работа с cookie уже на месте, но
обработчики `auth.signUp` и `auth.signInPassword` за ними — пока заглушки. Пока не завершена веха по
паролям, реальная отправка возвращает `?error=not_implemented`.
