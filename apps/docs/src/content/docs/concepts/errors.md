---
title: Errors and localization
description: Error codes are the stable contract; the message is a localized fallback.
---

Every failure is identified by a stable `code`. The `message` is localized to the caller's
`Accept-Language` where Gatekeeper has copy for it, but it stays a fallback — a client with its own
UI keys off `code` and `data`, not the sentence.

## The contract

A typed error carries three parts:

- `code` — a stable identifier such as `INVALID_CREDENTIALS` or `STEP_UP_REQUIRED`. This is the
  localization key. It is part of the contract and changes only with a version bump.
- `message` — a human-readable sentence, localized to the request's language (see
  [Locale resolution](#locale-resolution)). Safe to show as a fallback, but it carries no
  interpolated `data`, so a UI that formats `data` should render its own copy keyed by `code`.
- `data` — an optional structured payload for codes that need one: `retryAfter` seconds,
  `requiredAal`, a lockout `until` timestamp. Format it in the viewer's locale; do not read it as
  prose.

A client with rich UI keeps its own table of copy keyed by the code and the procedure it came from,
and renders that. The `code` set for each procedure is in the contract, so the table can be checked
against it.

## How a code arrives

| Surface        | Delivery                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/rpc`, `/api` | `{ code, message, data }`, `message` localized; on the SDK, `isDefinedError(err)` types `err.code` and `err.data` |
| `/form/*`      | a `303` back to the referring page with the code lowercased in `?error=`; `data` is dropped                       |

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

`/rpc` and `/api` localize the error `message` from the request's `Accept-Language`: the first tag
whose primary subtag Gatekeeper ships copy for wins, otherwise English. Supported: `en`, `ru`. An
unknown `code` keeps its English contract string. `code` and `data` never change with language.

The surfaces Gatekeeper renders itself — transactional emails, and the `/form/*` pages and their
error states — still need a language too. That resolution (realm default, overridden per request by
`Accept-Language`) is M8 work and is not implemented in the current scaffold; until then the
server-rendered strings are English only.
