---
title: HTML forms
description: Browser authentication flows without client-side JavaScript.
---

The form surface accepts browser posts at `/form/*`, writes HTTP-only session cookies, and redirects
with `303 See Other` so refreshing the destination cannot resubmit credentials.

```html
<form method="post" action="https://id.example.com/form/sign-up">
  <input type="hidden" name="redirect_to" value="https://app.example.com/welcome" />
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Create account</button>
</form>
```

`redirect_to` must match `ALLOWED_REDIRECT_ORIGINS`; Gatekeeper rejects any other target. This is
essential on an identity endpoint, where an unchecked redirect becomes an open redirect.

Every cookie-backed request requires CSRF protection. Gatekeeper checks `Origin` against
`ALLOWED_FORM_ORIGINS`. Requests that lack an `Origin` need the signed CSRF field issued by the form
flow. `SameSite` cookies are a supporting control, not the CSRF defense.
