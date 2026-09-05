import { assertEquals } from '@std/assert'
import { cookieStoreAdapter } from './storage.ts'

Deno.test('cookieStoreAdapter stores, reads, and removes namespaced tokens', async () => {
  const entries = new Map<string, string>()
  const writes: CookieInit[] = []
  const deletions: CookieStoreDeleteOptions[] = []
  const store = {
    get: (name: string) =>
      Promise.resolve(entries.has(name) ? { name, value: entries.get(name) } : null),
    set: (options: CookieInit) => {
      writes.push(options)
      entries.set(options.name, options.value)
      return Promise.resolve()
    },
    delete: (options: CookieStoreDeleteOptions) => {
      deletions.push(options)
      entries.delete(options.name)
      return Promise.resolve()
    },
  } as unknown as CookieStore
  const storage = cookieStoreAdapter('tenant', store)

  assertEquals(await storage.get('access_token'), null)
  await storage.set('access_token', 'token')
  assertEquals(await storage.get('access_token'), 'token')
  assertEquals(writes[0]?.name, 'tenant:access_token')
  assertEquals(writes[0]?.path, '/')
  assertEquals(writes[0]?.sameSite, 'strict')

  await storage.remove('access_token')
  assertEquals(await storage.get('access_token'), null)
  assertEquals(deletions, [{ name: 'tenant:access_token', path: '/' }])
})
