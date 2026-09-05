---
title: Hooks
description: Extend identity flows without moving product logic into Gatekeeper.
---

Hooks let the host product own product-specific flow decisions. A hook can reject a request or add
claims and patches to the flow.

Use a `sql` hook when its effect must be atomic with Gatekeeper's transaction. For example, a
successful sign-up can create a default workspace in the same transaction. The target is a qualified
PostgreSQL function accepting and returning `jsonb`.

Use an `http` hook for side effects. Blocking events wait for the signed webhook; after-events are
placed in the delivery outbox and retried with exponential backoff. A slow after-event endpoint
therefore does not hold a database transaction open.

Available hook points include `before_sign_up`, `after_sign_up`, `before_sign_in`, `after_sign_in`,
`before_token_issue`, `before_org_create`, `after_org_create`, `after_invite_accepted`, and
`before_password_change`.
