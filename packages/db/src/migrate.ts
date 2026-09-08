import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fromFileUrl } from '@std/path'
import { parse as parseYaml } from '@std/yaml'
import * as z from 'zod'
import { createDatabase } from './mod.ts'
import { expandEnv } from './env.ts'

const here = new URL('.', import.meta.url)

const bootstrapStatements = ['0000_bootstrap.sql']
const postMigrationStatements = ['0100_authz.sql', '0101_master_realm.sql']

async function applyRawSql(client: ReturnType<typeof createDatabase>['client'], name: string) {
  const sqlText = await Deno.readTextFile(new URL(`../sql/${name}`, here))
  await client.unsafe(sqlText)
  console.log(`applied ${name}`)
}

/**
 * Brings the identity database to the current schema: extensions, the generated
 * Drizzle migrations, then the raw SQL Drizzle cannot express. Idempotent — the
 * server calls it on every boot.
 */
export async function runMigrations(url: string): Promise<void> {
  const { db, client } = createDatabase(url, { max: 1 })
  try {
    for (const name of bootstrapStatements) await applyRawSql(client, name)

    await migrate(db, { migrationsFolder: fromFileUrl(new URL('../drizzle', here)) })
    console.log('drizzle migrations applied')

    for (const name of postMigrationStatements) await applyRawSql(client, name)
  } finally {
    await client.end()
  }
}

const DatabaseConfig = z.object({
  database: z.object({ url: z.string().min(1) }),
})

function configPath(args: string[]): string {
  const equalsArgument = args.find((argument) => argument.startsWith('--config='))
  if (equalsArgument) return equalsArgument.slice('--config='.length)

  const flagIndex = args.indexOf('--config')
  if (flagIndex === -1) return 'gatekeeper.yaml'

  const path = args[flagIndex + 1]
  if (!path) throw new Error('--config requires a YAML file path')
  return path
}

if (import.meta.main) {
  const yaml = expandEnv(await Deno.readTextFile(configPath(Deno.args)))
  await runMigrations(DatabaseConfig.parse(parseYaml(yaml)).database.url)
}
