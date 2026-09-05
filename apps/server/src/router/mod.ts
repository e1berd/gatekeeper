import { os } from '../middleware.ts'
import { auth } from './auth.ts'
import { profile } from './profile.ts'
import { passkey } from './passkey.ts'
import { mfa } from './mfa.ts'
import { org } from './org.ts'
import { authz } from './authz.ts'
import { sso } from './sso.ts'
import { hooks } from './hooks.ts'
import { admin } from './admin.ts'
import { config } from '../config.ts'

const health = os.health.handler(async ({ context }) => {
  const checks: Record<string, boolean> = { database: false }

  try {
    await context.db.execute('select 1')
    checks.database = true
  } catch {
    checks.database = false
  }

  return {
    status: Object.values(checks).every(Boolean) ? ('ok' as const) : ('degraded' as const),
    version: config.version,
    checks,
  }
})

export const router = os.router({
  health,
  auth,
  profile,
  passkey,
  mfa,
  org,
  authz,
  sso,
  hooks,
  admin,
})

export type Router = typeof router
