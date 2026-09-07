---
title: Social login
description: Google and GitHub authentication with PKCE.
---

Gatekeeper knows how to talk to Google and GitHub; a deployment supplies only credentials. A
provider with no entry under `oauth` is refused with `PROVIDER_NOT_CONFIGURED`, so enabling one is a
configuration change rather than a code change.

```yaml
oauth:
  google:
    clientId: '…'
    clientSecret: '…'
```

Register `<issuer>/oauth/<provider>/callback` as the redirect URI with the provider. That path is a
plain HTTP route, not an RPC procedure, because the provider redirects a browser straight at it.

## Two PKCE exchanges

The flow contains two independent PKCE pairs, and they are easy to confuse.

The **client's** pair protects the code Gatekeeper hands back: pass `codeChallenge` to
`auth.oauthStart` and the matching `codeVerifier` to `auth.oauthExchange`. Without it, an
authorization code intercepted in the redirect is enough to complete a sign-in.

The **server's** pair protects the code the provider hands back. Gatekeeper generates it, seals the
verifier with the realm's data key, and redeems it in the callback. Callers never see it.

`auth.oauthStart` returns `state` alongside the authorization URL so a client can check that the
browser came back from the flow it started. The value is single-use: the callback spends it, and a
second callback carrying the same one is rejected.

## Linking, and when it is refused

A provider identity that has been seen before signs its user in. Otherwise, when the provider
reports a **verified** email that already has an account, the identity is linked to that account
rather than creating a second user.

An **unverified** email that already has an account is refused with `EMAIL_TAKEN`. An unverified
address is a claim, not a proof, and honouring it would let anyone who can set a profile email on
the provider take over the matching Gatekeeper account.

When the address is new, the account is created, and it counts as verified only if the provider said
it was.
