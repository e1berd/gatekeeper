import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fromFileUrl } from '@std/path'
import { createDatabase } from './mod.ts'

const url = Deno.env.get('DATABASE_URL')
if (!url) {
  console.error('DATABASE_URL is not set')
  Deno.exit(1)
}

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

  for (const name of ['0100_authz.sql']) {
    const sqlText = await Deno.readTextFile(new URL(`../sql/${name}`, here))
    await client.unsafe(sqlText)
    console.log(`applied ${name}`)
  }
} finally {
  await client.end()
}
