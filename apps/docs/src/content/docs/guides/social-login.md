---
title: Social login
description: Google and GitHub authentication with PKCE.
---

`auth.oauthStart` begins a PKCE flow for Google or GitHub. After the provider callback,
`auth.oauthExchange` returns the regular authentication result. A verified matching email links a
new provider identity to the existing user instead of creating a duplicate account.
