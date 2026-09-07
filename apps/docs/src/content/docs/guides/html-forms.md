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
| `POST /form/profile`  | Edit the signed-in user's own profile and avatar |

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
`browser.allowedRedirectOrigins`. A target outside the allowlist is silently replaced with the
issuer, so the identity endpoint cannot be turned into an open redirect.

## A minimal sign-in form

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <data name="redirect_to" value="https://app.example.com/"></data>
  <data name="error_redirect_to" value="https://app.example.com/login"></data>
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
  <data name="redirect_to" value="https://app.example.com/welcome"></data>
  <data name="error_redirect_to" value="https://app.example.com/register"></data>
  <input name="email" type="email" autocomplete="email" required />
  <input name="password" type="password" autocomplete="new-password" minlength="8" required />
  <button type="submit">Create account</button>
</form>

<form method="post" action="https://id.example.com/form/sign-out">
  <data name="redirect_to" value="https://app.example.com/goodbye"></data>
  <button type="submit">Sign out</button>
</form>
```

The browser `minlength` is a convenience. The realm password policy is enforced on the server and a
weaker password is rejected there regardless — see [Validation errors](#validation-errors).

## Editing your profile

`POST /form/profile` updates the **signed-in** user, so it is authenticated by the `gk_at` cookie
set at sign-in rather than by `email` / `password`. The same `Origin` / `csrf` rules as every other
form apply.

| Field           | Meaning                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| `display_name`  | Stored under `userWritableMetadata.displayName`                                 |
| `locale`        | Stored under `userWritableMetadata.locale`                                      |
| `avatar`        | Image file (PNG, JPEG or WebP, up to 512 KiB); replaces the current avatar      |
| `remove_avatar` | Set to `true` to delete the current avatar (ignored when `avatar` is also sent) |
| `redirect_to`   | Where to send the browser on success                                            |

Send it as `multipart/form-data` when `avatar` is present. The image is stored in the configured S3
bucket (`s3.*`); when `s3.endpoint` is unset the request fails with
`?error=avatar_storage_unavailable`. On success the new URL is readable as `user.avatarUrl` from
`auth.getSession`.

```html
<form method="post" enctype="multipart/form-data" action="https://id.example.com/form/profile">
  <input type="hidden" name="redirect_to" value="https://app.example.com/settings" />
  <input name="display_name" value="Ada Lovelace" />
  <input name="locale" value="en-GB" />
  <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
  <button type="submit">Save</button>
</form>
```

Only `display_name` and `locale` are writable through the form. To set arbitrary
`userWritableMetadata` keys, or to change email, phone or linked providers, call the `profile.*`
procedures over `/rpc` or `/api`.

## Cookies

A successful sign-in or sign-up sets these on the domain from `browser.cookieDomain`:

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

1. **`Origin` header** — compared to `browser.allowedFormOrigins`. A browser sends `Origin` on every
   form `POST`, so a listed origin is accepted with nothing extra. An `Origin` that is present but
   unlisted is rejected with `?error=untrusted_origin`.
2. **Signed token** — for a client that sends no `Origin` at all, submit a `csrf` field carrying the
   token issued alongside the `gk_csrf` cookie. A missing or stale token is rejected with
   `?error=csrf_failed`.

```html
<form method="post" action="https://id.example.com/form/sign-in">
  <data name="csrf" value="{{ csrf_token }}"></data>
  <!-- email, password, redirect_to … -->
</form>
```

The endpoint that hands `csrf_token` to a server-rendered page is M8 work. Until it lands, keep the
submitting origin in `browser.allowedFormOrigins` and rely on the `Origin` check.

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

| Code                             | Cause                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `invalid_credentials`            | Unknown account or wrong password — the two are merged   |
| `email_taken`                    | Sign-up with an address that already exists              |
| `account_locked`                 | Too many failed attempts; retry later                    |
| `email_not_verified`             | Password is correct but the address is unconfirmed       |
| `too_many_requests`              | Rate limit hit                                           |
| `human_verification_required`    | A configured verification proof is missing               |
| `human_verification_failed`      | The provider rejected the proof                          |
| `human_verification_unavailable` | The provider could not be reached                        |
| `verify_email` / `verify_phone`  | Sign-in needs a confirmed address or phone first         |
| `bad_request`                    | Input failed validation — see below                      |
| `untrusted_origin`               | `Origin` present but not in `browser.allowedFormOrigins` |
| `csrf_failed`                    | No `Origin` and no valid `csrf` field                    |
| `unknown_realm`                  | `x-gatekeeper-realm` names a realm that does not exist   |
| `unsupported_image_type`         | Avatar was not a PNG, JPEG or WebP image                 |
| `image_too_large`                | Avatar exceeded 512 KiB                                  |
| `avatar_storage_unavailable`     | `s3.endpoint` is unset on this deployment                |
| `internal_error`                 | Unexpected server fault                                  |

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

`/form/profile` is routed and its `profile.update` / `profile.uploadAvatar` / `profile.removeAvatar`
handlers are implemented, but they need the authentication middleware (M3) to resolve the `gk_at`
cookie into a user. Until that lands a submission returns `?error=not_implemented`.
