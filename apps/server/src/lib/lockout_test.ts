import { assert, assertEquals, assertFalse } from '@std/assert'
import { LockoutPolicy } from '@gatekeeper/contract'
import { type LockoutState, lockoutVerdict } from './lockout.ts'

const policy = LockoutPolicy.parse({
  maxFailedAttempts: 3,
  baseBackoffSeconds: 2,
  maxBackoffSeconds: 60,
})

const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000)

function state(overrides: Partial<LockoutState> = {}): LockoutState {
  return { failedAttempts: 0, lastFailedAt: null, bannedUntil: null, ...overrides }
}

Deno.test('failures below the threshold do not lock the account', () => {
  const verdict = lockoutVerdict(state({ failedAttempts: 2, lastFailedAt: new Date() }), policy)

  assertFalse(verdict.locked)
  assertEquals(verdict.until, null)
})

Deno.test('the backoff doubles with every attempt past the threshold', () => {
  const first = lockoutVerdict(state({ failedAttempts: 3, lastFailedAt: new Date() }), policy)
  assert(first.locked)
  assert(first.until)
  assertEquals(Math.round((first.until.getTime() - Date.now()) / 1000), 2)

  const third = lockoutVerdict(state({ failedAttempts: 5, lastFailedAt: new Date() }), policy)
  assert(third.until)
  assertEquals(Math.round((third.until.getTime() - Date.now()) / 1000), 8)
})

Deno.test('the backoff is capped', () => {
  const verdict = lockoutVerdict(state({ failedAttempts: 40, lastFailedAt: new Date() }), policy)

  assert(verdict.until)
  assertEquals(Math.round((verdict.until.getTime() - Date.now()) / 1000), 60)
})

Deno.test('waiting out the backoff clears the lock without clearing the counter', () => {
  const verdict = lockoutVerdict(state({ failedAttempts: 3, lastFailedAt: secondsAgo(10) }), policy)

  assertFalse(verdict.locked)
})

Deno.test('an administrative ban outranks the attempt counter', () => {
  const banned = new Date(Date.now() + 3_600_000)
  const verdict = lockoutVerdict(state({ failedAttempts: 0, bannedUntil: banned }), policy)

  assert(verdict.locked)
  assertEquals(verdict.until, banned)
})

Deno.test('an expired ban stops locking the account', () => {
  const verdict = lockoutVerdict(state({ bannedUntil: secondsAgo(1) }), policy)

  assertFalse(verdict.locked)
})
