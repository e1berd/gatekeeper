---
title: Organizations and invitations
description: Create workspaces and manage scoped membership.
---

`org.create` atomically creates an organization and grants its creator `owner`. Invite members by
email; an invitation can be accepted before the person has an account. The last owner guard prevents
removal, demotion, or departure until `org.transferOwnership` completes.
