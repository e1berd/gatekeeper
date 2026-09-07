import { sql } from 'drizzle-orm'
import type { AuthResult } from '@gatekeeper/contract'
import { argon2idParamsFromPolicy, hashPassword } from './password.ts'
import { notFasterThan } from './errors.ts'
import {
  assertPasswordMeetsPolicy,
  EMAIL_TOKEN_TTL_SECONDS,
  findCredentials,
  type FlowEnv,
  mfaChallenge,
  reject,
} from './flows.ts'
import { openSession } from './password-auth.ts'
import { passwordResetMail } from './mail.ts'
import { claimOneTimeToken, issueOneTimeToken } from './one-time-tokens.ts'
import { toAllowedRedirect } from './redirects.ts'
import { revokeAllSessions } from './sessions.ts'

const MINIMUM_RESET_REQUEST_MS = 200

/** Confirms an address and signs the account in, since the link proves control of it. */
export async function verifyEmail(env: FlowEnv, token: string): Promise<AuthResult> {
  const db = env.session.db
  const claim = await claimOneTimeToken(db, token, 'confirmation')

  if (claim.status === 'invalid') return reject({ code: 'INVALID_TOKEN' })

  await db.execute(sql`
    update auth.users
    set email_verified_at = now(),
        status = case when status = 'pending' then 'active'::auth.user_status else status end,
        updated_at = now()
    where id = ${claim.userId}::uuid
  `)

  return (
    (await mfaChallenge(db, claim.userId)) ?? {
      status: 'authenticated',
      tokens: await openSession(env, claim.userId, ['email']),
    }
  )
}

export interface PasswordResetRequest {
  email: string
  redirectTo?: string | undefined
}

/**
 * Always reports that a message was sent. Answering differently for an address
 * with no account would turn password reset into an account-existence oracle,
 * so the work is padded to a floor as well as the response being uniform.
 */
export function requestPasswordReset(
  env: FlowEnv,
  input: PasswordResetRequest,
): Promise<{ sent: true }> {
  return notFasterThan(MINIMUM_RESET_REQUEST_MS, async () => {
    const row = await findCredentials(env.session.db, env.session.realmId, input.email)

    if (row && row.status !== 'disabled') {
      const token = await issueOneTimeToken(
        env.session.db,
        row.id,
        'recovery',
        EMAIL_TOKEN_TTL_SECONDS,
      )

      const target = toAllowedRedirect(input.redirectTo, env.allowedRedirectOrigins, env.issuer)
      await env.mailer.send(passwordResetMail(input.email, target, token.token))
    }

    return { sent: true } as const
  })
}

/**
 * Sets a new password from a recovery link and ends every session the account
 * has. Whoever prompted the reset may already be holding one.
 */
export async function resetPassword(
  env: FlowEnv,
  input: { token: string; password: string },
): Promise<{ ok: true }> {
  assertPasswordMeetsPolicy(input.password, env.settings)

  const db = env.session.db
  const claim = await claimOneTimeToken(db, input.token, 'recovery')

  if (claim.status === 'invalid') return reject({ code: 'INVALID_TOKEN' })

  const passwordHash = await hashPassword(
    input.password,
    argon2idParamsFromPolicy(env.settings.password),
  )

  await db.execute(sql`
    update auth.users
    set password_hash = ${passwordHash}, password_changed_at = now(),
        failed_attempts = 0, last_failed_at = null, updated_at = now()
    where id = ${claim.userId}::uuid
  `)

  await revokeAllSessions(db, claim.userId)

  return { ok: true } as const
}
