import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fromFileUrl } from '@std/path'
import { parse as parseYaml } from '@std/yaml'
import * as z from 'zod'
import { createDatabase } from './mod.ts'

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

const yaml = await Deno.readTextFile(configPath(Deno.args))
const url = DatabaseConfig.parse(parseYaml(yaml)).database.url
const here = new URL('.', import.meta.url)
const { db, client } = createDatabase(url, { max: 1 })

try {
  for (const name of ['0000_bootstrap.sql']) {
    const sqlText = await Deno.readTextFile(new URL(`../sql/${name}`, here))
    await client.unsafe(sqlText)
    console.log(`applied ${name}`)
  }

  await migrate(db, { migrationsFolder: fromFileUrl(new URL('../drizzle', here)) })
  console.log('drizzle migrations applied')

  for (const name of ['0100_authz.sql', '0101_master_realm.sql']) {
    const sqlText = await Deno.readTextFile(new URL(`../sql/${name}`, here))
    await client.unsafe(sqlText)
    console.log(`applied ${name}`)
  }
} finally {
  await client.end()
}
