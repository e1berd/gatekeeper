import { sql } from 'drizzle-orm'
import { schema } from '@gatekeeper/db'
import type { Database } from '@gatekeeper/db'
import type { Aal, Session, TokenPair, TokenPolicy, User } from '@gatekeeper/contract'
import { effectiveRoleKeys } from './authz.ts'
import { mintRefreshToken, revokeFamily, rotateRefreshToken } from './refresh-tokens.ts'
import type { MintedRefreshToken } from './refresh-tokens.ts'
import {
  loadSession,
  projectSession,
  SessionError,
  type SessionRow,
  sessionState,
} from './session-records.ts'
import type { TokenService } from './tokens.ts'
import { loadUser } from './user.ts'

export interface SessionEnv {
  db: Database
  tokens: TokenService
  realmId: string
  realmSlug: string
  policy: TokenPolicy
  audience: string
}

export interface SessionStart {
  userId: string
  aal: Aal
  amr: string[]
  ip: string | null
  userAgent: string | null
  deviceId: string | null
  activeOrgId?: string | null
  impersonatorId?: string | null
}

export interface MintedAccessToken {
  accessToken: string
  expiresIn: number
  roles: string[]
  activeOrgId: string | null
}

function scopeOf(row: SessionRow) {
  return row.active_org_id
    ? ({ type: 'org', id: row.active_org_id } as const)
    : ({ type: 'global', id: null } as const)
}

export async function mintAccessToken(
  env: SessionEnv,
  row: SessionRow,
): Promise<MintedAccessToken> {
  const roles = await effectiveRoleKeys(env.db, row.user_id, scopeOf(row))

  const { token, expiresIn } = await env.tokens.issueAccessToken({
    realmId: env.realmId,
    audience: env.audience,
    ttlSeconds: env.policy.accessTokenTtl,
    sub: row.user_id,
    sid: row.id,
    realm: env.realmSlug,
    aal: row.aal,
    amr: row.amr,
    org: row.active_org_id,
    roles,
    pv: row.permissions_version,
    act: row.impersonator_id,
  })

  return { accessToken: token, expiresIn, roles, activeOrgId: row.active_org_id }
}

async function tokenPair(
  env: SessionEnv,
  row: SessionRow,
  refresh: MintedRefreshToken,
): Promise<TokenPair> {
  const [access, user] = await Promise.all([
    mintAccessToken(env, row),
    loadUser(env.db, row.user_id),
  ])
  if (!user) throw new SessionError('invalid_token')

  return {
    accessToken: access.accessToken,
    tokenType: 'Bearer',
    expiresIn: access.expiresIn,
    refreshToken: refresh.token,
    session: projectSession(row),
    user,
  }
}

/** Opens a session and issues its first token pair. */
export async function startSession(env: SessionEnv, input: SessionStart): Promise<TokenPair> {
  const { sessionAbsoluteTimeout, refreshTokenTtl } = env.policy
  const notAfter = sessionAbsoluteTimeout
    ? new Date(Date.now() + sessionAbsoluteTimeout * 1000)
    : null

  const created = await env.db
    .insert(schema.sessions)
    .values({
      userId: input.userId,
      realmId: env.realmId,
      aal: input.aal,
      amr: input.amr,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceId: input.deviceId,
      activeOrgId: input.activeOrgId ?? null,
      impersonatorId: input.impersonatorId ?? null,
      notAfter,
    })
    .returning({ id: schema.sessions.id })

  const sessionId = created[0]?.id
  if (!sessionId) throw new Error('Failed to open a session')

  const refresh = await mintRefreshToken(env.db, sessionId, refreshTokenTtl)
  const row = await loadSession(env.db, sessionId)
  if (!row) throw new Error('Session vanished immediately after creation')

  return await tokenPair(env, row, refresh)
}

/**
 * Rotates the presented refresh token. Replaying a spent token revokes every
 * token in the family and the session with it.
 */
export async function refreshSession(env: SessionEnv, presented: string): Promise<TokenPair> {
  const outcome = await rotateRefreshToken(env.db, presented, env.policy.refreshTokenTtl)

  if (outcome.status === 'invalid') throw new SessionError('invalid_token')
  if (outcome.status === 'replayed') throw new SessionError('reuse_detected')

  const row = await loadSession(env.db, outcome.sessionId)
  const state = sessionState(row, env.policy)

  if (state !== 'live' || !row) {
    await revokeFamily(env.db, outcome.sessionId)
    throw new SessionError(state === 'revoked' ? 'session_revoked' : 'invalid_token')
  }

  await env.db.execute(sql`
    update auth.sessions set refreshed_at = now() where id = ${row.id}::uuid
  `)

  return await tokenPair(env, { ...row, refreshed_at: new Date() }, outcome.refresh)
}

export async function describeSession(
  db: Database,
  row: SessionRow,
): Promise<{ user: User; session: Session }> {
  const user = await loadUser(db, row.user_id)
  if (!user) throw new SessionError('invalid_token')

  return { user, session: projectSession(row) }
}

export async function revokeUserSession(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const rows = await db.execute<{ id: string }>(sql`
    select id from auth.sessions
    where id = ${sessionId}::uuid and user_id = ${userId}::uuid and revoked_at is null
  `)

  if (!rows[0]) return false

  await revokeFamily(db, sessionId)
  return true
}

/**
 * Revokes every session the user holds and returns how many ended. `except`
 * spares one — the caller's own, for operations that end *other* sessions
 * rather than signing the account out entirely.
 */
export async function revokeAllSessions(
  db: Database,
  userId: string,
  except: string | null = null,
): Promise<number> {
  const spared = except === null ? sql`true` : sql`s.id <> ${except}::uuid`

  await db.execute(sql`
    update auth.refresh_tokens rt set revoked_at = now()
    from auth.sessions s
    where s.id = rt.session_id and s.user_id = ${userId}::uuid
      and rt.revoked_at is null and ${spared}
  `)

  const ended = await db.execute<{ id: string }>(sql`
    update auth.sessions s set revoked_at = now()
    where s.user_id = ${userId}::uuid and s.revoked_at is null and ${spared}
    returning s.id
  `)

  return ended.length
}

/** Revokes one session, or signs the account out of all of them. */
export async function signOutSessions(
  db: Database,
  userId: string,
  scope: 'local' | 'global',
  sessionId: string | null = null,
): Promise<number> {
  if (scope === 'local') {
    return sessionId !== null && (await revokeUserSession(db, userId, sessionId)) ? 1 : 0
  }

  return await revokeAllSessions(db, userId)
}

/**
 * Rebinds the session to another organization and re-mints the access token.
 * Membership is proven by holding at least one role in that organization —
 * a user with no grant there cannot mint a token claiming it.
 */
export async function switchOrganization(
  env: SessionEnv,
  row: SessionRow,
  orgId: string | null,
): Promise<MintedAccessToken | null> {
  if (orgId !== null) {
    const roles = await effectiveRoleKeys(env.db, row.user_id, { type: 'org', id: orgId })
    if (roles.length === 0) return null
  }

  await env.db.execute(sql`
    update auth.sessions set active_org_id = ${orgId}::uuid where id = ${row.id}::uuid
  `)

  return await mintAccessToken(env, { ...row, active_org_id: orgId })
}
