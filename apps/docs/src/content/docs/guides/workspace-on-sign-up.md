---
title: Workspace on sign-up
description: Create a product workspace atomically with a new identity.
---

Register a blocking SQL `before_sign_up` hook to insert an organization and its owner grant in the
same transaction as the user. Either all records commit or none do. Use an `after_sign_up` HTTP hook
for asynchronous effects such as CRM synchronization and welcome email.
