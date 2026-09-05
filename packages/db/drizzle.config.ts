import type { Config } from 'drizzle-kit'

export default {
  schema: './packages/db/src/schema/mod.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: Deno.env.get('DATABASE_URL') ?? '' },
  schemaFilter: ['auth', 'rbac', 'audit'],
  verbose: true,
  strict: true,
} satisfies Config
