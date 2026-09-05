---
title: Errors and localization
description: Error codes are the localizable contract; messages are a developer fallback.
---

Gatekeeper never sends display-ready error text. Every failure is identified by a stable `code`, and
the caller owns the translation.

## The contract

A typed error carries three parts:

- `code` — a stable identifier such as `INVALID_CREDENTIALS` or `STEP_UP_REQUIRED`. This is the
  localization key. It is part of the contract and changes only with a version bump.
- `message` — an English string for logs and stack traces. It is a developer fallback, never shown
  to an end user, never translated.
- `data` — an optional structured payload for codes that need one: `retryAfter` seconds,
  `requiredAal`, a lockout `until` timestamp. Format it in the viewer's locale; do not read it as
  prose.

A client keeps its own table of copy keyed by the code and the procedure it came from, and renders
that. The `code` set for each procedure is in the contract, so the table can be checked against it.

## How a code arrives

| Surface        | Delivery                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| `/rpc`, `/api` | `{ code, message, data }`; on the SDK, `isDefinedError(err)` types `err.code` and `err.data` |
| `/form/*`      | a `303` back to the referring page with the code lowercased in `?error=`; `data` is dropped  |

Standards endpoints (`/.well-known/*`, OAuth and SAML callbacks) answer with plain HTTP status
codes, because a browser reaches them directly.

## Account enumeration

The sign-in flow collapses `USER_NOT_FOUND`, `INVALID_CREDENTIALS` and a missing identity into a
single `INVALID_CREDENTIALS`. "No such account" and "wrong password" are indistinguishable by code,
by `data`, and by timing. There is no endpoint that reports whether an email, phone or handle is
registered; a real-time "is this taken?" check on the public surface is enumeration and is not
offered.

## Input validation

Field-shape failures are separate from the error catalogues. They arrive as validation issues
identified by the issue `code` and the `path` to the field — `invalid_format` at `["slug"]`,
`too_small` at `["password"]`. The contract sets no custom messages on its schemas, so there is no
English string to surface in a form field: the client maps issue code plus path to its own copy.

## Locale resolution

API responses are locale-independent by design — they carry codes, not sentences. Only the surfaces
Gatekeeper renders itself need a language:

- transactional emails (verification, password reset, OTP, invitation, device alerts)
- the `/form/*` pages and their error states

Those resolve a locale from the realm's default, overridden per request by `Accept-Language`. This
is M8 work and is not implemented in the current scaffold; until then the server-rendered strings
are English only.
