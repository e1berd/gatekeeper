import { sql } from 'drizzle-orm'
import type { AuthResult } from '@gatekeeper/contract'
import {
  argon2idParamsFromPolicy,
  burnPasswordVerification,
  checkPassword,
  hashPassword,
} from './password.ts'
import { notFasterThan } from './errors.ts'
import {
  assertPasswordMeetsPolicy,
  EMAIL_TOKEN_TTL_SECONDS,
  findCredentials,
  type FlowEnv,
  lockoutStateOf,
  mfaChallenge,
  reject,
} from './flows.ts'
import { clearFailedAttempts, lockoutVerdict, recordFailedAttempt } from './lockout.ts'
import { verificationMail } from './mail.ts'
import { issueOneTimeToken } from './one-time-tokens.ts'
import { toAllowedRedirect } from './redirects.ts'
import { revokeAllSessions, startSession } from './sessions.ts'

const MINIMUM_SIGN_IN_MS = 250

export interface SignUpInput {
  email: string
  password: string
  userWritableMetadata: Record<string, unknown>
  redirectTo?: string | undefined
}

export interface SignInInput {
  email: string
  password: string
}

const domainOf = (email: string) => email.slice(email.lastIndexOf('@') + 1).toLowerCase()

function assertRealmAcceptsSignUp(env: FlowEnv, email: string): void {
  const policy = env.settings.signUp
  if (!policy.enabled) reject({ code: 'SIGN_UP_DISABLED' })

  const allowed = policy.allowedEmailDomains
  if (allowed.length > 0 && !allowed.includes(domainOf(email))) {
    reject({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', allowed })
  }
}

async function insertUser(
  env: FlowEnv,
  input: SignUpInput,
  passwordHash: string,
  verified: boolean,
): Promise<string> {
  const rows = await env.session.db.execute<{ id: string }>(sql`
    insert into auth.users (realm_id, email, password_hash, password_changed_at,
                            email_verified_at, status, user_metadata)
    values (
      ${env.session.realmId}::uuid, ${input.email}, ${passwordHash}, now(),
      ${verified ? sql`now()` : null}, ${verified ? 'active' : 'pending'},
      ${JSON.stringify(input.userWritableMetadata)}::jsonb
    )
    on conflict do nothing
    returning id
  `)

  const id = rows[0]?.id
  if (!id) reject({ code: 'EMAIL_TAKEN' })

  return id
}

async function linkPasswordIdentity(env: FlowEnv, userId: string, email: string): Promise<void> {
  await env.session.db.execute(sql`
    insert into auth.identities (user_id, realm_id, provider, provider_user_id, email)
    values (${userId}::uuid, ${env.session.realmId}::uuid, 'email', ${email}, ${email})
    on conflict do nothing
  `)
}

async function sendVerification(env: FlowEnv, userId: string, input: SignUpInput): Promise<void> {
  const token = await issueOneTimeToken(
    env.session.db,
    userId,
    'confirmation',
    EMAIL_TOKEN_TTL_SECONDS,
  )

  const target = toAllowedRedirect(input.redirectTo, env.allowedRedirectOrigins, env.issuer)
  await env.mailer.send(verificationMail(input.email, target, token.token))
}

/**
 * Registers an account. Whether the caller is signed in immediately or has to
 * confirm the address first is `signUp.requireEmailVerification` on the realm —
 * which is how a development realm hands out tokens straight away while a
 * production realm beside it still insists on the round trip.
 */
export async function signUp(env: FlowEnv, input: SignUpInput): Promise<AuthResult> {
  assertRealmAcceptsSignUp(env, input.email)
  assertPasswordMeetsPolicy(input.password, env.settings)

  const verificationRequired = env.settings.signUp.requireEmailVerification
  const passwordHash = await hashPassword(
    input.password,
    argon2idParamsFromPolicy(env.settings.password),
  )

  const userId = await insertUser(env, input, passwordHash, !verificationRequired)
  await linkPasswordIdentity(env, userId, input.email)

  if (verificationRequired) {
    await sendVerification(env, userId, input)
    return { status: 'verification_required', reason: 'email' }
  }

  return { status: 'authenticated', tokens: await openSession(env, userId, ['pwd']) }
}

export function openSession(env: FlowEnv, userId: string, amr: string[]) {
  return startSession(env.session, {
    userId,
    aal: 'aal1',
    amr,
    ip: env.ip,
    userAgent: env.userAgent,
    deviceId: null,
  })
}

async function authenticate(env: FlowEnv, input: SignInInput): Promise<AuthResult> {
  const params = argon2idParamsFromPolicy(env.settings.password)
  const db = env.session.db
  const row = await findCredentials(db, env.session.realmId, input.email)

  if (!row?.password_hash) {
    await burnPasswordVerification(input.password, params)
    return reject({ code: 'INVALID_CREDENTIALS' })
  }

  const lockout = lockoutVerdict(lockoutStateOf(row), env.settings.lockout)
  if (lockout.locked) {
    await burnPasswordVerification(input.password, params)
    return reject({ code: 'ACCOUNT_LOCKED', until: lockout.until })
  }

  const verdict = await checkPassword(row.password_hash, input.password, params)

  if (!verdict.valid) {
    await recordFailedAttempt(db, row.id)
    return reject({ code: 'INVALID_CREDENTIALS' })
  }

  if (row.status === 'disabled') return reject({ code: 'INVALID_CREDENTIALS' })
  if (row.status === 'locked') return reject({ code: 'ACCOUNT_LOCKED', until: null })

  if (env.settings.signUp.requireEmailVerification && row.email_verified_at === null) {
    return reject({ code: 'EMAIL_NOT_VERIFIED' })
  }

  if (verdict.rehash) {
    const rehashed = await hashPassword(input.password, params)
    await db.execute(sql`
      update auth.users set password_hash = ${rehashed} where id = ${row.id}::uuid
    `)
  }

  await clearFailedAttempts(db, row.id)

  return (
    (await mfaChallenge(db, row.id)) ?? {
      status: 'authenticated',
      tokens: await openSession(env, row.id, ['pwd']),
    }
  )
}

/**
 * Signs in with a password. Every path through it — unknown address, locked
 * account, wrong password — spends comparable work and cannot finish faster than
 * {@link MINIMUM_SIGN_IN_MS}, so response time answers nothing the opaque error
 * refuses to.
 */
export function signInPassword(env: FlowEnv, input: SignInInput): Promise<AuthResult> {
  return notFasterThan(MINIMUM_SIGN_IN_MS, () => authenticate(env, input))
}

export interface ChangePasswordInput {
  currentPassword: string | null
  newPassword: string
  revokeOtherSessions: boolean
}

export async function changePassword(
  env: FlowEnv,
  userId: string,
  sessionId: string,
  input: ChangePasswordInput,
): Promise<{ ok: true; revoked: number }> {
  assertPasswordMeetsPolicy(input.newPassword, env.settings)

  const db = env.session.db
  const params = argon2idParamsFromPolicy(env.settings.password)

  const rows = await db.execute<{ password_hash: string | null }>(sql`
    select password_hash from auth.users where id = ${userId}::uuid limit 1
  `)

  const stored = rows[0]?.password_hash ?? null

  if (stored !== null) {
    const verified =
      input.currentPassword !== null &&
      (await checkPassword(stored, input.currentPassword, params)).valid

    if (!verified) reject({ code: 'INVALID_CREDENTIALS' })
  }

  await db.execute(sql`
    update auth.users
    set password_hash = ${await hashPassword(input.newPassword, params)}, password_changed_at = now()
    where id = ${userId}::uuid
  `)

  if (!input.revokeOtherSessions) return { ok: true, revoked: 0 }

  const revoked = await revokeAllSessions(db, userId, sessionId)
  return { ok: true, revoked }
}
