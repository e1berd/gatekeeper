import { assert, assertEquals, assertRejects } from '@std/assert'
import { notFasterThan, opaque } from './errors.ts'

const FLOOR_MS = 60

Deno.test('opaque collapses every account-existence failure onto one code', () => {
  assertEquals(opaque('USER_NOT_FOUND'), 'INVALID_CREDENTIALS')
  assertEquals(opaque('IDENTITY_NOT_FOUND'), 'INVALID_CREDENTIALS')
  assertEquals(opaque('INVALID_CREDENTIALS'), 'INVALID_CREDENTIALS')
  assertEquals(opaque('ACCOUNT_LOCKED'), 'ACCOUNT_LOCKED')
})

Deno.test('a fast success still takes the floor', async () => {
  const startedAt = performance.now()
  const value = await notFasterThan(FLOOR_MS, () => Promise.resolve('done'))

  assertEquals(value, 'done')
  assert(performance.now() - startedAt >= FLOOR_MS)
})

Deno.test('a fast rejection takes the floor too, and still rejects', async () => {
  const startedAt = performance.now()

  await assertRejects(() =>
    notFasterThan(FLOOR_MS, () => Promise.reject(new Error('no such user'))),
  )

  assert(performance.now() - startedAt >= FLOOR_MS)
})

Deno.test('work slower than the floor is not delayed further', async () => {
  const startedAt = performance.now()

  await notFasterThan(FLOOR_MS, () => new Promise((resolve) => setTimeout(resolve, FLOOR_MS * 2)))

  assert(performance.now() - startedAt < FLOOR_MS * 4)
})
