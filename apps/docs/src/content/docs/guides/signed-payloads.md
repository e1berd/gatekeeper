---
title: Signed payloads
description: Signing in with a payload the provider signed itself, such as a Telegram Mini App.
---

Some providers do not run an authorization-code redirect. A Telegram Mini App hands the page an
`initData` string that Telegram signed with the bot's token; proving identity is a matter of
checking that signature, not of bouncing a browser through two endpoints.

`auth.verifySignedPayload` is that one call. It takes the blob, verifies it, and returns the same
authentication result every other flow returns.

```yaml
signedPayload:
  telegram:
    secret: '123456:AA…' # the bot token
    maxAgeSeconds: 86400
```

A provider with no entry here is refused with `PROVIDER_NOT_CONFIGURED`, so enabling one is a
configuration change rather than a code change.

## What is checked

For Telegram, the
[Mini Apps scheme](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
an HMAC over the sorted data-check-string, whose key is itself an HMAC of the bot token. The
comparison is constant-time, and `auth_date` must fall inside `maxAgeSeconds` — without that window
a captured payload would work forever.

Anything that fails — a missing hash, a payload edited after signing, a stale `auth_date`, a missing
user — comes back as `INVALID_TOKEN`. The caller is not told which, because a client that can tell a
bad signature from a stale one can also probe with it.

## Identity

The payload names a provider account, so it resolves the same way a social login does: a provider
identity seen before signs its user in, and an unseen one creates an account.

Telegram supplies no email address, so nothing is ever linked by email through this route, and the
account it creates has none. That is deliberate: linking on an address a provider has not verified
would let anyone who can set that address take over the matching account.

## `initData` is an entry ticket

It is not a session. Exchange it once, keep the tokens that come back, and refresh them like any
other session — a Mini App that re-sends `initData` on every request is re-authenticating instead of
staying signed in.
