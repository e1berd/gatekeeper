import { assertEquals } from '@std/assert'
import { TokenPolicy } from '@gatekeeper/contract'
import { type SessionRow, sessionState } from './session-records.ts'

const policy = TokenPolicy.parse({})

const HOUR_MS = 3_600_000

function row(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    user_id: '00000000-0000-4000-8000-0000000000aa',
    aal: 'aal1',
    amr: ['pwd'],
    ip: null,
    user_agent: null,
    active_org_id: null,
    not_after: null,
    refreshed_at: new Date(),
    revoked_at: null,
    created_at: new Date(),
    permissions_version: 1,
    impersonator_id: null,
    ...overrides,
  }
}

Deno.test('a freshly refreshed session is live', () => {
  assertEquals(sessionState(row(), policy), 'live')
})

Deno.test('a missing session is reported rather than thrown', () => {
  assertEquals(sessionState(undefined, policy), 'missing')
})

Deno.test('a revoked session stays revoked whatever the clocks say', () => {
  assertEquals(sessionState(row({ revoked_at: new Date() }), policy), 'revoked')
})

Deno.test('idle expiry follows refreshedAt', () => {
  const idle = new Date(Date.now() - (policy.sessionIdleTimeout + 60) * 1000)
  assertEquals(sessionState(row({ refreshed_at: idle }), policy), 'idle_expired')

  const recent = new Date(Date.now() - (policy.sessionIdleTimeout - 60) * 1000)
  assertEquals(sessionState(row({ refreshed_at: recent }), policy), 'live')
})

Deno.test('absolute expiry does not move when the session refreshes', () => {
  const expired = row({ not_after: new Date(Date.now() - HOUR_MS), refreshed_at: new Date() })
  assertEquals(sessionState(expired, policy), 'absolute_expired')

  const future = row({ not_after: new Date(Date.now() + HOUR_MS) })
  assertEquals(sessionState(future, policy), 'live')
})

Deno.test('revocation outranks both expiry clocks', () => {
  const both = row({
    revoked_at: new Date(),
    not_after: new Date(Date.now() - HOUR_MS),
  })

  assertEquals(sessionState(both, policy), 'revoked')
})
