---
title: SDK
description: Typed JavaScript client for one Gatekeeper realm.
---

```ts
import { Gatekeeper } from '@gatekeeper/sdk'

const gk = new Gatekeeper('https://id.myapp.com', { realm: 'realm-1' })

gk.addEventListener('signout', () => location.assign('/sign-in'))

const { session } = await gk.auth.getSession()
const { user } = await gk.auth.getMe()
```

The realm defaults to `master`, created by the database bootstrap. In a supported secure browser
context, the client keeps tokens through the asynchronous Cookie Store API. It falls back to
`localStorage` in other browsers and to memory outside browsers. Pass `storage` for SSR or another
runtime. Cookie Store cookies are readable by JavaScript; use the `/form/*` flow when tokens must be
HttpOnly.

`signout` is emitted after an explicit sign-out and after a refresh token can no longer create a
session. It is the single place for application navigation and local user-state cleanup.

## Authentication

Methods that can establish a session persist the returned tokens:

```ts
const result = await gk.auth.signIn({ email, password })

if (result.status === 'authenticated') {
  await gk.auth.getMe()
}

await gk.auth.signOut()
```

Password sign-up, OTP verification and passkey verification are exposed as `signUp`, `verifyOtp` and
`verifyPasskey`. `complete` persists an `AuthResult` obtained from a lower-level MFA flow.
`getAccessToken` and `isAuthenticated` refresh first when necessary.

Social login belongs to `auth.oauth`, because Gatekeeper is the OAuth client for Google, GitHub or
another configured social provider:

```ts
const { authorizationUrl } = await gk.auth.oauth.start({ provider: 'google' })
location.assign(authorizationUrl)

const result = await gk.auth.oauth.exchange({ code, codeVerifier })
```

## Enterprise SSO

Enterprise SSO is intentionally separate from social OAuth. It authenticates a workforce through a
realm's SAML or OIDC identity provider; it does not make Gatekeeper an OIDC provider for third-party
applications.

```ts
const { provider } = await gk.sso.discover({ email })
if (provider) {
  const { redirectUrl } = await gk.sso.start({ providerId: provider.id })
  location.assign(redirectUrl)
}
```

Discovery is optional: a sign-in screen may present a known provider directly. The returned URL is
the only browser-navigation value; the SDK never redirects by itself. This keeps navigation under
the application’s control and makes `redirectTo` validation a server responsibility.

Provider configuration is an administrative concern and lives under `sso.providers`:

```ts
await gk.sso.providers.create({ type: 'saml', name, metadataUrl })
const { items } = await gk.sso.providers.list()
```

The current contract also exposes `remove` and `metadata`. Keep create, secret rotation, enabling,
domain assignment and deletion administrative; keep discovery and start safe for an unauthenticated
sign-in screen. Other public domains are available directly as `gk.org`, `gk.authz`, `gk.hooks` and
`gk.admin`.
