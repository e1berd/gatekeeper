import { assert, assertEquals, assertFalse } from '@std/assert'
import { FakeTime } from '@std/testing/time'
import { RateLimitPolicy } from '@gatekeeper/contract'
import { checkRateLimit } from './rate-limit.ts'
import { createMemoryStore, type KeyValueStore } from './store.ts'

const policy = RateLimitPolicy.parse({ perIpPerMinute: 3, perIdentifierPerMinute: 2 })

const IP = '203.0.113.7'
const EMAIL = 'victim@example.test'

async function atFrozenClock(run: (time: FakeTime) => Promise<void>): Promise<void> {
  using time = new FakeTime(0)
  await run(time)
}

function recordingStore(): { store: KeyValueStore; keys: string[] } {
  const inner = createMemoryStore()
  const keys: string[] = []

  return {
    keys,
    store: {
      ...inner,
      increment: (key, ttl) => {
        keys.push(key)
        return inner.increment(key, ttl)
      },
    },
  }
}

Deno.test('the per-IP budget closes after its limit', () =>
  atFrozenClock(async () => {
    const store = createMemoryStore()

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const verdict = await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
      assert(verdict.allowed, `attempt ${attempt} should pass`)
    }

    const blocked = await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
    assertFalse(blocked.allowed)
    assertEquals(blocked.exceeded, 'ip')
    assertEquals(blocked.retryAfter, 60)
  }))

Deno.test('the per-identifier budget closes independently of the address', () =>
  atFrozenClock(async () => {
    const store = createMemoryStore()

    await checkRateLimit(store, 'sign_in', { ip: '198.51.100.1', identifier: EMAIL }, policy)
    await checkRateLimit(store, 'sign_in', { ip: '198.51.100.2', identifier: EMAIL }, policy)

    const blocked = await checkRateLimit(
      store,
      'sign_in',
      { ip: '198.51.100.3', identifier: EMAIL },
      policy,
    )

    assertFalse(blocked.allowed)
    assertEquals(blocked.exceeded, 'identifier')
  }))

Deno.test('actions hold separate budgets', () =>
  atFrozenClock(async () => {
    const store = createMemoryStore()

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
    }

    const other = await checkRateLimit(
      store,
      'password_reset',
      { ip: IP, identifier: null },
      policy,
    )
    assert(other.allowed)
  }))

Deno.test('a new window reopens the budget and retryAfter tracks the clock', () =>
  atFrozenClock(async (time) => {
    const store = createMemoryStore()

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
    }

    time.tick(20_000)
    const midWindow = await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
    assertFalse(midWindow.allowed)
    assertEquals(midWindow.retryAfter, 40)

    time.tick(41_000)
    const reopened = await checkRateLimit(store, 'sign_in', { ip: IP, identifier: null }, policy)
    assert(reopened.allowed)
  }))

Deno.test('identifiers are hashed before they reach the store', () =>
  atFrozenClock(async () => {
    const { store, keys } = recordingStore()

    await checkRateLimit(store, 'sign_in', { ip: IP, identifier: EMAIL }, policy)

    const identifierKey = keys.find((key) => key.includes(':identifier:'))
    assert(identifierKey)
    assertFalse(identifierKey.includes(EMAIL))
    assertFalse(identifierKey.includes('victim'))
  }))

Deno.test('the identifier budget ignores case', () =>
  atFrozenClock(async () => {
    const store = createMemoryStore()

    await checkRateLimit(store, 'sign_in', { ip: null, identifier: 'User@Example.test' }, policy)
    await checkRateLimit(store, 'sign_in', { ip: null, identifier: 'user@example.TEST' }, policy)

    const blocked = await checkRateLimit(
      store,
      'sign_in',
      { ip: null, identifier: 'USER@EXAMPLE.TEST' },
      policy,
    )

    assertFalse(blocked.allowed)
  }))
