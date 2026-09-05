---
title: Human verification
description: Protect anonymous authentication operations with a CAPTCHA or ALTCHA Sentinel.
---

Gatekeeper can require a provider token before selected anonymous authentication operations. The
same policy applies to RPC, REST, the SDK, and HTML forms. Verification is disabled by default.

Supported providers are Cloudflare Turnstile, hCaptcha, Google reCAPTCHA, and ALTCHA Sentinel.
Provider secrets stay on the server. `humanVerification.config` returns only the public site key or
ALTCHA challenge URL, the protected actions, and the canonical form field name.

## Protected operations

| Action             | Procedure                   | Typical use                  |
| ------------------ | --------------------------- | ---------------------------- |
| `sign_up`          | `auth.signUp`               | Prevent bulk registrations   |
| `sign_in_password` | `auth.signInPassword`       | Protect password login       |
| `sign_in_otp`      | `auth.signInOtp`            | Prevent bulk OTP delivery    |
| `password_reset`   | `auth.requestPasswordReset` | Protect reset email delivery |

Human verification supplements rate limiting and account lockout; it does not replace them.

## Complete provider configuration

For Turnstile or hCaptcha:

```yaml
humanVerification:
  provider: turnstile
  actions: [sign_up, sign_in_password, sign_in_otp, password_reset]
  hostnames: [id.example.com]
  siteKey: public-site-key
  secret: server-secret
  timeoutMs: 5000
```

Use `hcaptcha` as the provider value for hCaptcha.

For reCAPTCHA v3, add the accepted score threshold:

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

Gatekeeper expects a score, so `recaptcha` requires a reCAPTCHA v3 key.

For ALTCHA Sentinel:

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

The challenge URL is public. `secret` remains server-only. Gatekeeper refuses to start with an
unknown provider or action, an invalid URL, timeout, or score.

## Client-side provider discovery

Applications can discover the deployment configuration instead of duplicating it:

```ts
const gatekeeper = new Gatekeeper(new URL('https://id.example.com'))
const verification = await gatekeeper.humanVerification.config()

const action = 'sign_in_password'
const isRequired = verification.protectedActions.includes(action)
```

The REST equivalent is `GET /api/human-verification/config`. CAPTCHA providers return `siteKey`,
ALTCHA returns `challengeUrl`, and a disabled deployment returns `{ "provider": "disabled" }`.

## SDK examples

The same `humanVerification` field is available on every protected procedure:

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

Obtain a fresh proof for every retry. Do not persist or log it.

## REST example

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

The field is optional in OpenAPI because protected actions are deployment-specific. Gatekeeper
requires it at runtime when the current action is protected.

## HTML widget examples

Add the page origin to `browser.allowedFormOrigins`. The remaining form fields and redirect rules
are covered by the [HTML forms guide](./html-forms/).

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
  <button type="submit">Sign in</button>
</form>
```

Turnstile creates `cf-turnstile-response`. The widget action must match the Gatekeeper action.

### hCaptcha

```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>

<form method="post" action="https://id.example.com/form/sign-up">
  <input name="email" type="email" required />
  <input name="password" type="password" minlength="8" required />
  <div class="h-captcha" data-sitekey="public-site-key"></div>
  <button type="submit">Create account</button>
</form>
```

### reCAPTCHA v3

```html
<script src="https://www.google.com/recaptcha/api.js?render=public-site-key"></script>

<form id="sign-in" method="post" action="https://id.example.com/form/sign-in">
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <data name="human_verification"></data>
  <button type="submit">Sign in</button>
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
  <button type="submit">Sign in</button>
</form>
```

Pin the ALTCHA script version or serve it from your own origin in production. Outside localhost,
ALTCHA requires HTTPS.

## Error handling

| RPC / REST                       | `/form/*`                        | Meaning                     |
| -------------------------------- | -------------------------------- | --------------------------- |
| `HUMAN_VERIFICATION_REQUIRED`    | `human_verification_required`    | Proof was not submitted     |
| `HUMAN_VERIFICATION_FAILED`      | `human_verification_failed`      | Provider rejected the proof |
| `HUMAN_VERIFICATION_UNAVAILABLE` | `human_verification_unavailable` | Provider is unavailable     |

Provider outages fail closed: the authentication operation is not run. Forms put the error code in
`?error=`; RPC and REST return a typed oRPC error.

## Production checklist

- Keep `humanVerification.secret` in a secret manager and never send it to the browser.
- Configure `humanVerification.hostnames` for production domains.
- Bind Turnstile and reCAPTCHA proofs to their Gatekeeper action.
- Serve authentication forms and widgets over HTTPS.
- Never log proofs, provider secrets, or complete authentication requests.
- Keep rate limiting, account lockout, CSRF, and email verification enabled as applicable.

See the official widget documentation for [Turnstile](https://developers.cloudflare.com/turnstile/),
[hCaptcha](https://docs.hcaptcha.com/),
[reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3), and
[ALTCHA](https://altcha.org/docs/integration/widget/).
