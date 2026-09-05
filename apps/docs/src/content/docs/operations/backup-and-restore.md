---
title: Backup and restore
description: Recover identity data and the keys needed to decrypt it.
---

Back up PostgreSQL, audit partitions, and the protected KEK material together. Test restore into an
isolated environment, verify migrations, decrypt a representative secret, and validate JWKS. Never
restore production cookies or email delivery settings into an internet-accessible test environment.
