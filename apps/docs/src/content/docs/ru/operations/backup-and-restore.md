---
title: Backup и restore
description: Восстановление identity-данных и ключей расшифровки.
---

Сохраняйте PostgreSQL, audit partitions и защищённый KEK вместе. Тестируйте restore в изолированном
окружении: проверьте миграции, расшифровку тестового секрета и JWKS. Не переносите production cookie
и email-настройки в доступную извне тестовую среду.
