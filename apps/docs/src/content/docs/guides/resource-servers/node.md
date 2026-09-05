---
title: Express and Fastify
description: JWT middleware for Node.js resource servers.
---

Use `jose` with a cached remote JWKS for Express middleware or Fastify `preHandler`. Verify `iss`,
`aud`, `exp`, and `nbf`; attach the verified payload to the request and key local provisioning on
`sub`. Keep unauthenticated routes outside the middleware. Refresh an SSR cookie on the server and
use `authz.check` only for decisions that cannot wait for claim renewal.
