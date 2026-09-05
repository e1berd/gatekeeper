---
title: REST API
description: The generated OpenAPI 3.1 contract.
---

The REST contract is generated from `packages/contract` during `deno task docs:build`. Download the
exact specification served by this documentation build at [openapi.json](/openapi.json).

The REST API is served below `/api/*`. The JavaScript SDK instead uses `/rpc/*`, preserving values
that JSON cannot represent faithfully. Contract endpoints describe the intended API; in the current
scaffold all but the health handler return `501 NOT_IMPLEMENTED`.
