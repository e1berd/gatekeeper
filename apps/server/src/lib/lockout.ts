import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import type { LockoutPolicy } from '@gatekeeper/contract'
import { toNullableDate } from './rows.ts'

export interface LockoutState {
  failedAttempts: number
  lastFailedAt: Date | null
  bannedUntil: Date | null
}

export interface LockoutVerdict {
  locked: boolean
  /** When the account becomes usable again. `null` whenever it is not locked. */
  until: Date | null
}

const CLEAR: LockoutVerdict = { locked: false, until: null }

function backoffSeconds(state: LockoutState, policy: LockoutPolicy): number {
  const excess = state.failedAttempts - policy.maxFailedAttempts
  if (excess < 0) return 0

  return Math.min(policy.baseBackoffSeconds * 2 ** excess, policy.maxBackoffSeconds)
}

/**
 * How long an account stays shut after repeated failures. The window doubles
 * with every attempt past the threshold and is measured from the last failure,
 * so a patient attacker gains nothing by pausing — the counter only resets on a
 * successful sign-in.
 */
export function lockoutVerdict(state: LockoutState, policy: LockoutPolicy): LockoutVerdict {
  if (state.bannedUntil !== null && state.bannedUntil.getTime() > Date.now()) {
    return { locked: true, until: state.bannedUntil }
  }

  const seconds = backoffSeconds(state, policy)
  if (seconds === 0 || state.lastFailedAt === null) return CLEAR

  const until = new Date(state.lastFailedAt.getTime() + seconds * 1000)
  return until.getTime() > Date.now() ? { locked: true, until } : CLEAR
}

type LockoutRow = {
  failed_attempts: number
  last_failed_at: string | null
  banned_until: string | null
}

export async function readLockout(db: Database, userId: string): Promise<LockoutState | null> {
  const rows = await db.execute<LockoutRow>(sql`
    select failed_attempts, last_failed_at, banned_until
    from auth.users where id = ${userId}::uuid limit 1
  `)

  const row = rows[0]
  if (!row) return null

  return {
    failedAttempts: row.failed_attempts,
    lastFailedAt: toNullableDate(row.last_failed_at),
    bannedUntil: toNullableDate(row.banned_until),
  }
}

export async function recordFailedAttempt(db: Database, userId: string): Promise<void> {
  await db.execute(sql`
    update auth.users
    set failed_attempts = failed_attempts + 1, last_failed_at = now()
    where id = ${userId}::uuid
  `)
}

export async function clearFailedAttempts(db: Database, userId: string): Promise<void> {
  await db.execute(sql`
    update auth.users
    set failed_attempts = 0, last_failed_at = null, last_sign_in_at = now()
    where id = ${userId}::uuid and failed_attempts > 0
  `)
}
