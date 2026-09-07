import type { AuthResult, RealmSettings } from '@gatekeeper/contract'
import { issueOneTimeToken } from './one-time-tokens.ts'
import type { Database } from '@gatekeeper/db'
import type { Mailer } from './mail.ts'
import type { SessionEnv } from './sessions.ts'
import { sql } from 'drizzle-orm'
import { toNullableDate } from './rows.ts'

export const MFA_CHALLENGE_TTL_SECONDS = 300
export const EMAIL_TOKEN_TTL_SECONDS = 3600

/** Everything a sign-in or account flow needs beyond the session machinery. */
export interface FlowEnv {
  session: SessionEnv
  settings: RealmSettings
  mailer: Mailer
  allowedRedirectOrigins: readonly string[]
  issuer: string
  ip: string | null
  userAgent: string | null
}

export type FlowFailure =
  | { code: 'INVALID_CREDENTIALS' }
  | { code: 'ACCOUNT_LOCKED'; until: Date | null }
  | { code: 'EMAIL_NOT_VERIFIED' }
  | { code: 'EMAIL_TAKEN' }
  | { code: 'WEAK_PASSWORD'; minLength: number }
  | { code: 'SIGN_UP_DISABLED' }
  | { code: 'EMAIL_DOMAIN_NOT_ALLOWED'; allowed: string[] }
  | { code: 'INVALID_TOKEN' }
  | { code: 'PROVIDER_NOT_CONFIGURED'; provider: string }

/** A flow rejection carrying the contract error code the surface should raise. */
export class FlowError extends Error {
  constructor(readonly failure: FlowFailure) {
    super(failure.code)
    this.name = 'FlowError'
  }
}

export function reject(failure: FlowFailure): never {
  throw new FlowError(failure)
}

export type CredentialsRow = {
  id: string
  email: string | null
  password_hash: string | null
  status: 'active' | 'pending' | 'locked' | 'disabled'
  email_verified_at: string | null
  failed_attempts: number
  last_failed_at: string | null
  banned_until: string | null
}

export async function findCredentials(
  db: Database,
  realmId: string,
  email: string,
): Promise<CredentialsRow | undefined> {
  const rows = await db.execute<CredentialsRow>(sql`
    select id, email, password_hash, status, email_verified_at,
           failed_attempts, last_failed_at, banned_until
    from auth.users
    where realm_id = ${realmId}::uuid and email = ${email} and deleted_at is null
    limit 1
  `)

  return rows[0]
}

export const lockoutStateOf = (row: CredentialsRow) => ({
  failedAttempts: row.failed_attempts,
  lastFailedAt: toNullableDate(row.last_failed_at),
  bannedUntil: toNullableDate(row.banned_until),
})

type FactorRow = {
  id: string
  type: 'totp' | 'webauthn' | 'recovery_code'
  friendly_name: string | null
}

async function verifiedFactors(db: Database, userId: string): Promise<FactorRow[]> {
  return await db.execute<FactorRow>(sql`
    select id, type, friendly_name from auth.mfa_factors
    where user_id = ${userId}::uuid and status = 'verified'
  `)
}

/**
 * Returns the `mfa_required` branch when the account carries a verified second
 * factor, and `null` when it does not. The challenge is a single-use token, so
 * the half-authenticated state lives in the database rather than in a claim.
 */
export async function mfaChallenge(db: Database, userId: string): Promise<AuthResult | null> {
  const factors = await verifiedFactors(db, userId)
  if (factors.length === 0) return null

  const challenge = await issueOneTimeToken(
    db,
    userId,
    'reauthentication',
    MFA_CHALLENGE_TTL_SECONDS,
  )

  return {
    status: 'mfa_required',
    challengeToken: challenge.token,
    factors: factors.map((factor) => ({
      id: factor.id,
      type: factor.type,
      name: factor.friendly_name,
    })),
  }
}

export function assertPasswordMeetsPolicy(password: string, settings: RealmSettings): void {
  const { minLength } = settings.password
  if (password.length < minLength) reject({ code: 'WEAK_PASSWORD', minLength })
}
