/**
 * Shared key-value storage for rate limiting and the permission cache.
 *
 * Two drivers implement it. `memory` is the default and needs no service;
 * `redis` is selected automatically when `redis.url` is configured, and is only
 * required when several replicas must enforce one shared rate limit.
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  /** Returns the value after incrementing. Sets the TTL on first increment. */
  increment(key: string, ttlSeconds: number): Promise<number>
  delete(key: string): Promise<void>
  close(): Promise<void>
}

type Entry = { value: string; expiresAt: number }

const SWEEP_INTERVAL_MS = 60_000

export function createMemoryStore(): KeyValueStore {
  const entries = new Map<string, Entry>()

  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key)
    }
  }, SWEEP_INTERVAL_MS)

  const read = (key: string): Entry | null => {
    const entry = entries.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key)
      return null
    }
    return entry
  }

  return {
    get: (key) => Promise.resolve(read(key)?.value ?? null),

    set: (key, value, ttlSeconds) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
      return Promise.resolve()
    },

    increment: (key, ttlSeconds) => {
      const existing = read(key)
      const next = Number(existing?.value ?? 0) + 1
      entries.set(key, {
        value: String(next),
        expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1000,
      })
      return Promise.resolve(next)
    },

    delete: (key) => {
      entries.delete(key)
      return Promise.resolve()
    },

    close: () => {
      clearInterval(sweep)
      entries.clear()
      return Promise.resolve()
    },
  }
}

export async function createRedisStore(url: string): Promise<KeyValueStore> {
  const { createClient } = await import('redis')
  const client = createClient({ url })

  client.on('error', (error: unknown) => {
    console.error('[gatekeeper] redis', error)
  })

  try {
    await client.connect()
  } catch (cause) {
    throw new Error(
      'Cannot reach the Redis in redis.url. Set it to null for a single-node deployment.',
      { cause },
    )
  }

  return {
    get: (key) => client.get(key),

    set: async (key, value, ttlSeconds) => {
      await client.set(key, value, { EX: ttlSeconds })
    },

    increment: async (key, ttlSeconds) => {
      const next = await client.incr(key)
      if (next === 1) await client.expire(key, ttlSeconds)
      return next
    },

    delete: async (key) => {
      await client.del(key)
    },

    close: async () => {
      await client.close()
    },
  }
}

export async function createStore(redisUrl: string | null): Promise<KeyValueStore> {
  return redisUrl ? await createRedisStore(redisUrl) : createMemoryStore()
}
