---
title: Permissions and entitlements
description: Separate access decisions from plan capacity.
---

A permission answers whether a subject may perform an action. An entitlement answers whether the
realm or organization has capacity for it. An owner may have permission to create an organization
and still receive a quota denial when the plan's organization limit is exhausted.

Gatekeeper combines scoped permission resolution with quota availability in one authorization
decision. Roles belong to people and scopes; entitlements belong to a plan. Changing one never
silently changes the other.
