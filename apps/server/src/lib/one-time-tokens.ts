import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import { createOpaqueToken, sha256Hex } from './tokens.ts'

export type OneTimeTokenType =
  | 'confirmation'
  | 'recovery'
  | 'email_change'
  | 'phone_change'
  | 'invite'
  | 'reauthentication'

export interface IssuedOneTimeToken {
  token: string
  expiresAt: Date
}

export type OneTimeTokenClaim =
  | { status: 'claimed'; userId: string; relatesTo: string | null }
  | { status: 'invalid' }

/**
 * Issues a single-use token for an out-of-band flow — email confirmation,
 * password recovery, an MFA challenge. Only the digest is stored, so the value
 * exists in exactly one place: the message that carries it.
 *
 * Issuing invalidates any unused token of the same type for that user, so a
 * second "resend" cannot leave two live links behind.
 */
export async function issueOneTimeToken(
  db: Database,
  userId: string,
  type: OneTimeTokenType,
  ttlSeconds: number,
  relatesTo: string | null = null,
): Promise<IssuedOneTimeToken> {
  const { token, hash } = await createOpaqueToken()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await db.execute(sql`
    update auth.one_time_tokens set consumed_at = now()
    where user_id = ${userId}::uuid and type = ${type}::auth.one_time_token_type
      and consumed_at is null
  `)

  await db.execute(sql`
    insert into auth.one_time_tokens (user_id, type, token_hash, relates_to, expires_at)
    values (
      ${userId}::uuid, ${type}::auth.one_time_token_type, ${hash}, ${relatesTo},
      ${expiresAt.toISOString()}::timestamptz
    )
  `)

  return { token, expiresAt }
}

/**
 * Spends a token. The update is the check: a row can only be consumed while it
 * is unconsumed and unexpired, so two concurrent redemptions cannot both win.
 */
export async function claimOneTimeToken(
  db: Database,
  presented: string,
  type: OneTimeTokenType,
): Promise<OneTimeTokenClaim> {
  const hash = await sha256Hex(presented)

  const rows = await db.execute<{ user_id: string; relates_to: string | null }>(sql`
    update auth.one_time_tokens
    set consumed_at = now()
    where token_hash = ${hash} and type = ${type}::auth.one_time_token_type
      and consumed_at is null and expires_at > now()
    returning user_id, relates_to
  `)

  const row = rows[0]
  return row
    ? { status: 'claimed', userId: row.user_id, relatesTo: row.relates_to }
    : {
        status: 'invalid',
      }
}
