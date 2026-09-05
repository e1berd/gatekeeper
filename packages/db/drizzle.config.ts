import type { Config } from 'npm:drizzle-kit@0.31.10'
import { parse as parseYaml } from '@std/yaml'
import * as z from 'zod'

const DatabaseConfig = z.object({
  database: z.object({ url: z.string().min(1) }),
})

const yaml = Deno.readTextFileSync('gatekeeper.yaml')
const databaseUrl = DatabaseConfig.parse(parseYaml(yaml)).database.url

export default {
  schema: './packages/db/src/schema/mod.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  schemaFilter: ['auth', 'rbac', 'audit'],
  verbose: true,
  strict: true,
} satisfies Config
