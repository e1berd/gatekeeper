import { assertEquals, assertThrows } from '@std/assert'
import { expandEnv } from './env.ts'

const env = (entries: Record<string, string>) => ({ get: (key: string) => entries[key] })

Deno.test('expandEnv substitutes a set variable', () => {
  assertEquals(expandEnv('url: ${DB}', env({ DB: 'postgres://x' })), 'url: postgres://x')
})

Deno.test('expandEnv falls back to the default when unset', () => {
  assertEquals(expandEnv('url: ${DB:-postgres://local}', env({})), 'url: postgres://local')
})

Deno.test('expandEnv prefers a set variable over its default', () => {
  assertEquals(expandEnv('${DB:-fallback}', env({ DB: 'real' })), 'real')
})

Deno.test('expandEnv throws on an unset variable with no default', () => {
  assertThrows(() => expandEnv('${MISSING}', env({})), Error, 'MISSING')
})

Deno.test('expandEnv leaves text without references untouched', () => {
  assertEquals(expandEnv('plain: value', env({})), 'plain: value')
})
