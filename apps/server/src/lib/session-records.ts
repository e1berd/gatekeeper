import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import type { Aal, Session, TokenPolicy } from '@gatekeeper/contract'
import { toDate, toNullableDate } from './rows.ts'

export type SessionRow = {
  id: string
  user_id: string
  aal: Aal
  amr: string[]
  ip: string | null
  user_agent: string | null
  active_org_id: string | null
  not_after: Date | null
  refreshed_at: Date
  revoked_at: Date | null
  created_at: Date
  permissions_version: number
  impersonator_id: string | null
}

type RawSessionRow = Omit<
  SessionRow,
  'not_after' | 'refreshed_at' | 'revoked_at' | 'created_at'
> & {
  not_after: string | null
  refreshed_at: string
  revoked_at: string | null
  created_at: string
}

function hydrate(raw: RawSessionRow): SessionRow {
  return {
    ...raw,
    not_after: toNullableDate(raw.not_after),
    refreshed_at: toDate(raw.refreshed_at),
    revoked_at: toNullableDate(raw.revoked_at),
    created_at: toDate(raw.created_at),
  }
}

export type SessionState = 'live' | 'missing' | 'revoked' | 'idle_expired' | 'absolute_expired'

export type SessionFailure = 'invalid_token' | 'reuse_detected' | 'session_revoked'

export class SessionError extends Error {
  constructor(readonly reason: SessionFailure) {
    super(reason)
    this.name = 'SessionError'
  }
}

const SELECT_SESSION = sql`
  select
    s.id, s.user_id, s.aal, s.amr, host(s.ip) as ip, s.user_agent, s.active_org_id,
    s.not_after, s.refreshed_at, s.revoked_at, s.created_at,
    u.permissions_version, s.impersonator_id
  from auth.sessions s
  join auth.users u on u.id = s.user_id
`

export function projectSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    aal: row.aal,
    amr: row.amr,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    refreshedAt: row.refreshed_at,
    notAfter: row.not_after,
  }
}

/**
 * Sessions expire on two clocks: idle expiry advances every time the session
 * refreshes, while an absolute expiry, when the realm sets one, never moves.
 */
export function sessionState(row: SessionRow | undefined, policy: TokenPolicy): SessionState {
  if (!row) return 'missing'
  if (row.revoked_at !== null) return 'revoked'
  if (row.not_after !== null && row.not_after.getTime() <= Date.now()) return 'absolute_expired'

  const idleDeadline = row.refreshed_at.getTime() + policy.sessionIdleTimeout * 1000
  return idleDeadline <= Date.now() ? 'idle_expired' : 'live'
}

export async function loadSession(
  db: Database,
  sessionId: string,
): Promise<SessionRow | undefined> {
  const rows = await db.execute<RawSessionRow>(sql`
    ${SELECT_SESSION} where s.id = ${sessionId}::uuid limit 1
  `)

  const raw = rows[0]
  return raw ? hydrate(raw) : undefined
}

/** Loads a session only when it is still usable, mapping every other state onto a failure. */
export async function requireLiveSession(
  db: Database,
  sessionId: string,
  policy: TokenPolicy,
): Promise<SessionRow> {
  const row = await loadSession(db, sessionId)
  const state = sessionState(row, policy)

  if (state === 'live' && row) return row
  throw new SessionError(state === 'revoked' ? 'session_revoked' : 'invalid_token')
}

export async function listUserSessions(db: Database, userId: string): Promise<Session[]> {
  const rows = await db.execute<RawSessionRow>(sql`
    ${SELECT_SESSION}
    where s.user_id = ${userId}::uuid and s.revoked_at is null
    order by s.refreshed_at desc
  `)

  return rows.map((raw) => projectSession(hydrate(raw)))
}
