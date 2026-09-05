import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/mod.ts'

export * as schema from './schema/mod.ts'
export { sql } from 'drizzle-orm'

const DEFAULT_POOL_SIZE = 10
const PREPARED_STATEMENTS_BREAK_TRANSACTION_POOLERS = false

export type Database = ReturnType<typeof createDatabase>['db']

export function createDatabase(url: string, options: { max?: number } = {}) {
  const client = postgres(url, {
    max: options.max ?? DEFAULT_POOL_SIZE,
    prepare: PREPARED_STATEMENTS_BREAK_TRANSACTION_POOLERS,
    onnotice: () => {},
  })

  return { db: drizzle(client, { schema }), client }
}
