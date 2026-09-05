---
title: SDK
description: Типизированный JavaScript-клиент для одного realm Gatekeeper.
---

```ts
import { Gatekeeper } from '@gatekeeper/sdk'

const gk = new Gatekeeper('https://id.myapp.com', { realm: 'realm-1' })

gk.addEventListener('signout', () => location.assign('/sign-in'))

const { session } = await gk.auth.getSession()
const { user } = await gk.auth.getMe()
```

Если `realm` не указан, клиент выбирает `master`; его создаёт bootstrap базы данных. В браузере
токены хранятся в `localStorage`, вне браузера — в памяти. Для SSR и других окружений передайте свой
`storage`.

Событие `signout` возникает и после явного выхода, и когда refresh token больше не может создать
сессию. В обработчике удобно очистить локальное состояние приложения и перейти на страницу входа.

## Аутентификация

Методы, которые могут создать сессию, сохраняют полученные токены:

```ts
const result = await gk.auth.signIn({ email, password })

if (result.status === 'authenticated') {
  await gk.auth.getMe()
}

await gk.auth.signOut()
```

Для регистрации, OTP и passkey есть `signUp`, `verifyOtp` и `verifyPasskey`. `complete` сохраняет
`AuthResult`, полученный в низкоуровневом MFA-flow. `getAccessToken` и `isAuthenticated` сначала при
необходимости выполняют refresh.

Социальный вход находится в `auth.oauth`: здесь Gatekeeper выступает OAuth-клиентом Google, GitHub
или другого подключённого социального провайдера.

```ts
const { authorizationUrl } = await gk.auth.oauth.start({ provider: 'google' })
location.assign(authorizationUrl)

const result = await gk.auth.oauth.exchange({ code, codeVerifier })
```

## Enterprise SSO

Enterprise SSO намеренно отделён от social OAuth. Он аутентифицирует сотрудников через SAML или OIDC
identity provider realm-а; при этом Gatekeeper не становится OIDC provider-ом для сторонних
приложений.

```ts
const { provider } = await gk.sso.discover({ email })
if (provider) {
  const { redirectUrl } = await gk.sso.start({ providerId: provider.id })
  location.assign(redirectUrl)
}
```

Discovery необязателен: страница входа может показать заранее известный провайдер. SDK не делает
редирект сам — он возвращает только URL, поэтому навигация остаётся под контролем приложения, а
проверка `redirectTo` остаётся обязанностью сервера.

Настройка провайдеров — административная задача и находится в `sso.providers`:

```ts
await gk.sso.providers.create({ type: 'saml', name, metadataUrl })
const { items } = await gk.sso.providers.list()
```

В текущем контракте также есть `remove` и `metadata`. Создание, ротация секретов, включение,
назначение доменов и удаление должны оставаться административными; discovery и start должны быть
доступны на неаутентифицированной странице входа. Остальные публичные домены доступны как `gk.org`,
`gk.authz`, `gk.hooks` и `gk.admin`.
