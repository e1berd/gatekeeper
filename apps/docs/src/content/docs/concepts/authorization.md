---
title: Authorization
description: Scoped role grants model membership and access independently.
---

Membership is a grant, not a user foreign key. A `rbac.user_roles` record assigns a role with one of
three scopes: global, organization, or resource. This makes a user with no workspace valid and
allows the same person to hold different roles in different organizations.

Permissions answer whether a subject may perform an action. Entitlements answer whether a plan has
capacity for it. They are deliberately separate. `authz.check` combines the answers for callers,
while the database functions resolve the effective permissions.

Roles may inherit permissions. A change to a user's grants bumps `permissions_version`, which lets
permission caches become unreachable rather than serving stale authorizations.
