import { contract } from '../packages/contract/src/mod.ts'

const force = Deno.args.includes('--force')

const isProcedure = (v: unknown): boolean =>
  typeof v === 'object' && v !== null && '~orpc' in (v as Record<string, unknown>)

function emit(node: Record<string, unknown>, path: string[], depth: number): string {
  const pad = '  '.repeat(depth)
  return Object.entries(node)
    .map(([key, value]) => {
      const next = [...path, key]
      if (isProcedure(value)) {
        return `${pad}${key}: authed.${next.join('.')}.handler(todo('${next.join('.')}')),`
      }
      return `${pad}${key}: {\n${emit(value as Record<string, unknown>, next, depth + 1)}\n${pad}},`
    })
    .join('\n')
}

const domains = [
  'auth',
  'profile',
  'passkey',
  'mfa',
  'org',
  'authz',
  'sso',
  'hooks',
  'admin',
] as const

for (const domain of domains) {
  const path = `./apps/server/src/router/${domain}.ts`
  if (!force) {
    try {
      await Deno.stat(path)
      console.log(`skip ${domain} (exists)`)
      continue
    } catch {
      /* not there yet, generate it */
    }
  }

  const body = emit(contract[domain] as Record<string, unknown>, [domain], 1)
  await Deno.writeTextFile(
    path,
    `import { authed } from '../middleware.ts'\n` +
      `import { todo } from '../lib/todo.ts'\n\n` +
      `export const ${domain} = {\n${body}\n}\n`,
  )
  console.log(`generated router/${domain}.ts`)
}
