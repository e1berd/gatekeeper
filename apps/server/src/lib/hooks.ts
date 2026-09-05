import { sql } from 'drizzle-orm'
import { ORPCError } from '@orpc/server'
import type { Database } from '@gatekeeper/db'
import {
  ALLOW,
  type HookEvent,
  type HookOutcome,
  isBlockingEvent,
  mergeOutcomes,
  parseOutcome,
} from './hook-types.ts'

export type SqlExecutor = Pick<Database, 'execute'>

const QUALIFIED_FUNCTION_NAME = /^[a-z_][a-z0-9_]{0,62}\.[a-z_][a-z0-9_]{0,62}$/

type HookRow = {
  id: string
  kind: 'sql' | 'http'
  target: string
  timeout_ms: number
  runs_inside_caller_transaction: boolean
}

async function loadHooks(
  executor: SqlExecutor,
  realmId: string,
  event: HookEvent,
): Promise<HookRow[]> {
  return await executor.execute<HookRow>(sql`
    select id, kind, target, timeout_ms, runs_inside_caller_transaction
    from auth.hooks
    where realm_id = ${realmId}::uuid and event = ${event} and enabled
    order by priority, created_at
  `)
}

async function runSqlHook(
  executor: SqlExecutor,
  target: string,
  payload: Record<string, unknown>,
): Promise<HookOutcome> {
  if (!QUALIFIED_FUNCTION_NAME.test(target)) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: `Hook target is not a qualified function name: ${target}`,
    })
  }

  const rows = await executor.execute<{ outcome: unknown }>(sql`
    select ${sql.raw(target)}(${JSON.stringify(payload)}::jsonb) as outcome
  `)

  return parseOutcome(rows[0]?.outcome ?? null)
}

async function runHttpHook(
  target: string,
  timeoutMs: number,
  signature: string,
  body: string,
): Promise<HookOutcome> {
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-gatekeeper-signature': signature,
    },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: `Hook ${target} responded ${response.status}`,
    })
  }

  return parseOutcome(await response.json())
}

async function signPayload(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return `sha256=${Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}

export async function runBlockingHooks(
  executor: SqlExecutor,
  realmId: string,
  event: HookEvent,
  payload: Record<string, unknown>,
  httpSecret: string,
): Promise<HookOutcome> {
  const rows = await loadHooks(executor, realmId, event)
  if (rows.length === 0) return ALLOW

  const body = JSON.stringify({ event, payload })
  const signature = await signPayload(body, httpSecret)
  let outcome = ALLOW

  for (const row of rows) {
    const next =
      row.kind === 'sql'
        ? await runSqlHook(executor, row.target, payload)
        : await runHttpHook(row.target, row.timeout_ms, signature, body)

    outcome = mergeOutcomes(outcome, next)
    if (outcome.decision === 'deny') return outcome
  }

  return outcome
}

export async function runAfterHooks(
  executor: SqlExecutor,
  realmId: string,
  event: HookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const rows = await loadHooks(executor, realmId, event)

  for (const row of rows) {
    if (row.kind === 'sql' && row.runs_inside_caller_transaction) {
      await runSqlHook(executor, row.target, payload)
      continue
    }

    await executor.execute(sql`
      insert into auth.hook_deliveries (realm_id, hook_id, event, payload)
      values (${realmId}::uuid, ${row.id}::uuid, ${event}, ${JSON.stringify(payload)}::jsonb)
    `)
  }
}

export function denyToError(outcome: HookOutcome): ORPCError<string, unknown> {
  return new ORPCError(outcome.code ?? 'FORBIDDEN', {
    message: outcome.message ?? 'Rejected by policy',
  })
}

export { isBlockingEvent }
export type { HookEvent, HookOutcome }
