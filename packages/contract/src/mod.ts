import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { auth } from './routes/auth.ts'
import { profile } from './routes/profile.ts'
import { passkey } from './routes/passkey.ts'
import { mfa } from './routes/mfa.ts'
import { authz } from './routes/authz.ts'
import { sso } from './routes/sso.ts'
import { org } from './routes/org.ts'
import { hooks } from './routes/hooks.ts'
import { admin } from './routes/admin.ts'

export * from './schemas.ts'
export * from './settings.ts'
export * from './errors.ts'

const health = oc.meta(openapi({ method: 'GET', path: '/health', tags: ['meta'] })).output(
  z.object({
    status: z.enum(['ok', 'degraded']),
    version: z.string(),
    checks: z.record(z.string(), z.boolean()),
  }),
)

export const contract = { health, auth, profile, passkey, mfa, org, authz, sso, hooks, admin }

export type Contract = typeof contract
