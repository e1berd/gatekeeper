import { assert, assertEquals, assertFalse, assertMatch } from '@std/assert'
import {
  argon2idParamsFromPolicy,
  checkPassword,
  hashPassword,
  needsRehash,
  OWASP_ARGON2ID_PARAMS,
  verifyPassword,
} from './password.ts'

const FAST_PARAMS = { memoryKib: 19_456, timeCost: 2, parallelism: 1 }
const WEAKER_PARAMS = { memoryKib: 8_192, timeCost: 2, parallelism: 1 }
const STRONGER_PARAMS = { memoryKib: 19_456, timeCost: 4, parallelism: 1 }

Deno.test('hashPassword emits an Argon2id v19 PHC string with the OWASP parameters', async () => {
  const digest = await hashPassword('correct horse battery staple')
  assertMatch(digest, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/)
})

Deno.test('verifyPassword accepts the original password and rejects a wrong one', async () => {
  const digest = await hashPassword('s3cret-passphrase', FAST_PARAMS)
  assert(await verifyPassword(digest, 's3cret-passphrase'))
  assertFalse(await verifyPassword(digest, 's3cret-passphras3'))
})

Deno.test('verifyPassword returns false for a malformed or non-Argon2 hash', async () => {
  assertFalse(await verifyPassword('not-a-hash', 'whatever'))
  assertFalse(await verifyPassword('$2b$12$abcdefghijklmnopqrstuv', 'whatever'))
})

Deno.test('needsRehash is false when the stored hash matches the target parameters', async () => {
  const digest = await hashPassword('pw', FAST_PARAMS)
  assertFalse(needsRehash(digest, FAST_PARAMS))
})

Deno.test('needsRehash is true when the stored hash is weaker than the target', async () => {
  const digest = await hashPassword('pw', WEAKER_PARAMS)
  assert(needsRehash(digest, FAST_PARAMS))
})

Deno.test('needsRehash leaves a hash stronger than the target alone', async () => {
  const digest = await hashPassword('pw', STRONGER_PARAMS)
  assertFalse(needsRehash(digest, FAST_PARAMS))
})

Deno.test('needsRehash is true for a hash it cannot parse as Argon2', () => {
  assert(needsRehash('$2b$12$abcdefghijklmnopqrstuv', OWASP_ARGON2ID_PARAMS))
  assert(needsRehash('garbage', OWASP_ARGON2ID_PARAMS))
})

Deno.test('argon2idParamsFromPolicy maps the realm policy fields', () => {
  const params = argon2idParamsFromPolicy({
    minLength: 12,
    requireBreachCheck: false,
    argon2MemoryKib: 65_536,
    argon2TimeCost: 3,
    argon2Parallelism: 2,
  })
  assertEquals(params, { memoryKib: 65_536, timeCost: 3, parallelism: 2 })
})

Deno.test('checkPassword reports validity and rehash need together', async () => {
  const weakDigest = await hashPassword('pw', WEAKER_PARAMS)
  assertEquals(await checkPassword(weakDigest, 'pw', FAST_PARAMS), { valid: true, rehash: true })
  assertEquals(await checkPassword(weakDigest, 'wrong', FAST_PARAMS), {
    valid: false,
    rehash: false,
  })

  const currentDigest = await hashPassword('pw', FAST_PARAMS)
  assertEquals(await checkPassword(currentDigest, 'pw', FAST_PARAMS), {
    valid: true,
    rehash: false,
  })
})
