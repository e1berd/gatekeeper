---
title: Upgrades
description: Apply schema and application releases safely.
---

Take a verified backup, deploy the new image, and let the one-shot migration service complete before
starting new API replicas. Review changed realm settings and run smoke tests for sign-in, refresh,
JWKS, and an authorization check. Roll back application code only when its schema compatibility is
known.
