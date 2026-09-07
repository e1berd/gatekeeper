import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import { createOpaqueToken, sha256Hex } from './tokens.ts'

type Executor = Pick<Database, 'execute'>

export interface MintedRefreshToken {
  token: string
  expiresAt: Date
}

type RefreshTokenRow = {
  session_id: string
  used_at: Date | null
  revoked_at: Date | null
  expired: boolean
}

/**
 * The outcome of presenting a refresh token. `replayed` means a token that had
 * already been spent was presented again — the caller must revoke the whole
 * family, because either the client or an attacker is holding a stolen copy and
 * there is no way to tell which.
 */
export type RotationOutcome =
  | { status: 'rotated'; sessionId: string; refresh: MintedRefreshToken }
  | { status: 'replayed'; sessionId: string }
  | { status: 'invalid' }

function expiresAfter(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000)
}

/** Issues a refresh token for a session. Only its digest reaches the database. */
export async function mintRefreshToken(
  executor: Executor,
  sessionId: string,
  ttlSeconds: number,
  parentHash: string | null = null,
): Promise<MintedRefreshToken> {
  const { token, hash } = await createOpaqueToken()
  const expiresAt = expiresAfter(ttlSeconds)

  await executor.execute(sql`
    insert into auth.refresh_tokens (session_id, token_hash, parent_hash, expires_at)
    values (${sessionId}::uuid, ${hash}, ${parentHash}, ${expiresAt.toISOString()}::timestamptz)
  `)

  return { token, expiresAt }
}

/** Revokes every refresh token of a session and the session itself. */
export async function revokeFamily(executor: Executor, sessionId: string): Promise<void> {
  await executor.execute(sql`
    update auth.refresh_tokens set revoked_at = now()
    where session_id = ${sessionId}::uuid and revoked_at is null
  `)

  await executor.execute(sql`
    update auth.sessions set revoked_at = now()
    where id = ${sessionId}::uuid and revoked_at is null
  `)
}

/**
 * Spends a refresh token and issues its successor inside one transaction, so a
 * token can never be rotated twice. A replay revokes the family and reports
 * `replayed`; the caller decides which error the surface shows.
 */
export async function rotateRefreshToken(
  db: Database,
  presented: string,
  ttlSeconds: number,
): Promise<RotationOutcome> {
  const hash = await sha256Hex(presented)

  return await db.transaction(async (tx) => {
    const rows = await tx.execute<RefreshTokenRow>(sql`
      select session_id, used_at, revoked_at, expires_at <= now() as expired
      from auth.refresh_tokens
      where token_hash = ${hash}
      for update
    `)

    const row = rows[0]
    if (!row) return { status: 'invalid' }

    if (row.used_at !== null) {
      await revokeFamily(tx, row.session_id)
      return { status: 'replayed', sessionId: row.session_id }
    }

    if (row.revoked_at !== null || row.expired) return { status: 'invalid' }

    await tx.execute(sql`
      update auth.refresh_tokens set used_at = now() where token_hash = ${hash}
    `)

    return {
      status: 'rotated',
      sessionId: row.session_id,
      refresh: await mintRefreshToken(tx, row.session_id, ttlSeconds, hash),
    }
  })
}
