import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import { RealmSettings } from '@gatekeeper/contract'
import type { RealmContext } from '../context.ts'

const CACHE_TTL_MS = 30_000

const cache = new Map<string, { value: RealmContext; expiresAt: number }>()

export async function resolveRealmBySlug(db: Database, slug: string): Promise<RealmContext | null> {
  const cached = cache.get(slug)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const rows = await db.execute<{ id: string; slug: string; settings: unknown }>(sql`
    select id, slug, settings from auth.realms where slug = ${slug} limit 1
  `)

  const row = rows[0]
  if (!row) return null

  const value: RealmContext = {
    realmId: row.id,
    realmSlug: row.slug,
    settings: RealmSettings.parse(row.settings ?? {}),
  }

  cache.set(slug, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

export function invalidateRealm(slug: string): void {
  cache.delete(slug)
}
