---
title: HTML forms
description: Browser authentication flows without client-side JavaScript.
---

The form surface at `/form/*` exists for pages that submit a plain HTML `<form>` and run no
JavaScript. Gatekeeper processes the submission, sets `HttpOnly` session cookies, and answers with
`303 See Other` so reloading the destination cannot resubmit the credentials.

Only `POST` is accepted; any other method returns `405`. Every response is a redirect with no body.

## Endpoints

| Endpoint              | Effect                                           |
| --------------------- | ------------------------------------------------ |
| `POST /form/sign-up`  | Create a password identity, then sign in         |
| `POST /form/sign-in`  | Sign in with an existing password                |
| `POST /form/sign-out` | Revoke the current session and clear its cookies |

Any other path under `/form/` returns `404`. The `verify-email`, `reset-password`,
`accept-invitation`, and `mfa-challenge` endpoints are planned (M8) and not routed yet.

## Fields

Each value is a form field, not a header or a query parameter.

| Field               | Required         | Meaning                                                  |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `email`             | yes              | Account email                                            |
| `password`          | yes              | Cleartext over TLS; never logged                         |
| `redirect_to`       | no               | Where to send the browser on success                     |
| `error_redirect_to` | no               | Where to send it on failure; falls back to the `Referer` |
| `mfa_redirect_to`   | no               | Where to send it when a second factor is required        |
| `csrf`              | when no `Origin` | Signed token, for clients that send no `Origin` header   |

`redirect_to`, `error_redirect_to`, and `mfa_redirect_to` are each checked against
`ALLOWED_REDIRECT_ORIGINS`. A target outside the allowlist is silently replaced with the issuer, so
the identity endpoint cannot be turned into an open redirect.

## A minimal sign-in form

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <input type="hidden" name="redirect_to" value="https://app.example.com/" />
  <input type="hidden" name="error_redirect_to" value="https://app.example.com/login" />
  <input name="email" type="email" autocomplete="username" required />
  <input name="password" type="password" autocomplete="current-password" required />
  <button type="submit">Sign in</button>
</form>
```

On success the browser lands on `redirect_to` with `gk_at` and `gk_rt` set. On failure it lands on
`error_redirect_to` with `?error=<code>` appended and no cookies.

## Sign-up and sign-out

```html
<form method="post" action="https://id.example.com/form/sign-up">
  <input type="hidden" name="redirect_to" value="https://app.example.com/welcome" />
  <input type="hidden" name="error_redirect_to" value="https://app.example.com/register" />
  <input name="email" type="email" autocomplete="email" required />
  <input name="password" type="password" autocomplete="new-password" minlength="8" required />
  <button type="submit">Create account</button>
</form>

<form method="post" action="https://id.example.com/form/sign-out">
  <input type="hidden" name="redirect_to" value="https://app.example.com/goodbye" />
  <button type="submit">Sign out</button>
</form>
```

The browser `minlength` is a convenience. The realm password policy is enforced on the server and a
weaker password is rejected there regardless — see [Validation errors](#validation-errors).

## Cookies

A successful sign-in or sign-up sets these on the domain from `COOKIE_DOMAIN`:

| Cookie    | Contents            | Lifetime                       |
| --------- | ------------------- | ------------------------------ |
| `gk_at`   | Access token        | realm `tokens.accessTokenTtl`  |
| `gk_rt`   | Refresh token       | realm `tokens.refreshTokenTtl` |
| `gk_csrf` | Signed CSRF token   | 1 hour                         |
| `gk_mfa`  | MFA challenge token | 5 minutes                      |

All are `HttpOnly` and `SameSite=Lax`, and `Secure` whenever the issuer is `https`. `SameSite` is a
supporting control, not the CSRF defence.

## CSRF

A cookie-authenticated `POST` needs proof that it came from your own page.

1. **`Origin` header** — compared to `ALLOWED_FORM_ORIGINS`. A browser sends `Origin` on every form
   `POST`, so a listed origin is accepted with nothing extra. An `Origin` that is present but
   unlisted is rejected with `?error=untrusted_origin`.
2. **Signed token** — for a client that sends no `Origin` at all, submit a `csrf` field carrying the
   token issued alongside the `gk_csrf` cookie. A missing or stale token is rejected with
   `?error=csrf_failed`.

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <input type="hidden" name="csrf" value="{{ csrf_token }}" />
  <!-- email, password, redirect_to … -->
</form>
```

The endpoint that hands `csrf_token` to a server-rendered page is M8 work. Until it lands, keep the
submitting origin in `ALLOWED_FORM_ORIGINS` and rely on the `Origin` check.

## Realm selection

The form surface reads the realm from the `x-gatekeeper-realm` request header and falls back to
`master`. A browser cannot set that header, so a multi-realm deployment terminates each realm on its
own hostname and has the reverse proxy inject it. An unknown slug is rejected with
`?error=unknown_realm`.

## What comes back

| Outcome                   | Redirect                                                           | Cookies          |
| ------------------------- | ------------------------------------------------------------------ | ---------------- |
| Authenticated             | `redirect_to`, else the issuer                                     | `gk_at`, `gk_rt` |
| Second factor required    | `mfa_redirect_to`, else `<issuer>/mfa`                             | `gk_mfa`         |
| Email or phone unverified | `error_redirect_to` with `?error=verify_email` (or `verify_phone`) | none             |
| Any failure               | `error_redirect_to` with `?error=<code>`                           | none             |

### Reading the error

The error reaches your page as a lowercase code in the query string — never as a sentence. Map it to
your own copy, in your own language:

```html
<!-- https://app.example.com/login?error=invalid_credentials -->
<div id="form-error" role="alert"></div>
<script type="module">
const MESSAGES = {
  invalid_credentials: 'Wrong email or password.',
  too_many_requests: 'Too many attempts. Please wait and try again.',
  email_taken: 'That email is already registered.',
  email_not_verified: 'Confirm your email address to continue.',
  verify_email: 'Check your inbox to confirm your address.',
  untrusted_origin: 'This form was submitted from an unrecognised site.',
  csrf_failed: 'Your session expired. Reload the page and try again.',
  bad_request: 'Please check the form and try again.',
}
const code = new URLSearchParams(location.search).get('error')
if (code) {
  document.getElementById('form-error').textContent = MESSAGES[code] ??
    'Something went wrong. Please try again.'
}
</script>
```

Codes the form surface can emit:

| Code                            | Cause                                                  |
| ------------------------------- | ------------------------------------------------------ |
| `invalid_credentials`           | Unknown account or wrong password — the two are merged |
| `email_taken`                   | Sign-up with an address that already exists            |
| `account_locked`                | Too many failed attempts; retry later                  |
| `email_not_verified`            | Password is correct but the address is unconfirmed     |
| `too_many_requests`             | Rate limit hit                                         |
| `verify_email` / `verify_phone` | Sign-in needs a confirmed address or phone first       |
| `bad_request`                   | Input failed validation — see below                    |
| `untrusted_origin`              | `Origin` present but not in `ALLOWED_FORM_ORIGINS`     |
| `csrf_failed`                   | No `Origin` and no valid `csrf` field                  |
| `unknown_realm`                 | `x-gatekeeper-realm` names a realm that does not exist |
| `internal_error`                | Unexpected server fault                                |

The structured `data` some codes carry on `/rpc` and `/api` — `retryAfter` for `too_many_requests`,
`until` for `account_locked` — is **not** forwarded through the form redirect. A page that needs it
must call `/rpc` or `/api`.

## Validation errors

The form surface reports **every** input-validation failure as the single code `bad_request`, with
no indication of which field failed or why. It is enough to re-render the form with a general
notice, not enough to highlight one field.

For per-field feedback, either validate in the browser before submitting (`type="email"`,
`minlength`, `pattern`) or submit through `/rpc` or `/api`, which return the full issue list.

An `/rpc` sign-in with the SDK:

```ts
import { isDefinedError, safe } from '@orpc/client'
import { Gatekeeper } from '@gatekeeper/sdk'

const gk = new Gatekeeper('https://id.example.com', { realm: 'production' })

const { error, data } = await safe(gk.auth.signIn({ email, password }))

if (!error) {
  // data.status is 'authenticated' | 'mfa_required' | 'verification_required'
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

`error.code === 'BAD_REQUEST'` is oRPC's input-validation error. Its `data.issues` is a
Standard-Schema issue array: each entry has a `path` to the field and a machine `code`
(`invalid_format`, `too_small`, `invalid_type`, …). The contract sets no human-readable messages on
its schemas, so `issue.message` is a developer fallback — key your copy off `issue.code` and
`issue.path`.

`isDefinedError` narrows `error` to the codes the procedure declares in the contract; that is where
`error.data` becomes typed (`retryAfter`, `requiredAal`). `BAD_REQUEST` is not a declared code, so
its `data` is `unknown` and you read `issues` off it directly.

See [Errors and localization](/concepts/errors/) for the model behind this.

## Current status

The `/form/*` router, CSRF checks, redirect guard, and cookie handling are in place, but the
`auth.signUp` and `auth.signInPassword` handlers behind them are still stubs. Until the password
milestone lands, a real submission returns `?error=not_implemented`.
