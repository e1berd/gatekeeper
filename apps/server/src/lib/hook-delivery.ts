import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'

const MAX_ATTEMPTS = 8
const BASE_BACKOFF_SECONDS = 5
const BATCH_SIZE = 20
const POLL_INTERVAL_MS = 5000

type DueDelivery = {
  id: string
  event: string
  payload: Record<string, unknown>
  attempts: number
  target: string
  timeout_ms: number
  signing_secret_encrypted: string | null
}

function backoffSeconds(attempts: number): number {
  return BASE_BACKOFF_SECONDS * Math.pow(2, attempts)
}

async function claimDue(db: Database): Promise<DueDelivery[]> {
  return await db.execute<DueDelivery>(sql`
    with claimed as (
      select d.id
      from auth.hook_deliveries d
      where d.status = 'pending' and d.next_attempt_at <= now()
      order by d.next_attempt_at
      limit ${BATCH_SIZE}
      for update skip locked
    )
    update auth.hook_deliveries d
    set attempts = d.attempts + 1
    from claimed c
    join auth.hooks h on h.id = (select hook_id from auth.hook_deliveries where id = c.id)
    where d.id = c.id
    returning d.id, d.event, d.payload, d.attempts,
              h.target, h.timeout_ms, h.signing_secret_encrypted
  `)
}

async function markDelivered(db: Database, id: string): Promise<void> {
  await db.execute(sql`
    update auth.hook_deliveries
    set status = 'delivered', delivered_at = now(), last_error = null
    where id = ${id}::uuid
  `)
}

async function markFailed(db: Database, delivery: DueDelivery, error: string): Promise<void> {
  const exhausted = delivery.attempts >= MAX_ATTEMPTS

  await db.execute(sql`
    update auth.hook_deliveries
    set status = ${exhausted ? 'exhausted' : 'pending'},
        last_error = ${error},
        next_attempt_at = now() + ${`${backoffSeconds(delivery.attempts)} seconds`}::interval
    where id = ${delivery.id}::uuid
  `)
}

async function deliver(delivery: DueDelivery, signature: string): Promise<void> {
  const response = await fetch(delivery.target, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-gatekeeper-signature': signature },
    body: JSON.stringify({ event: delivery.event, payload: delivery.payload }),
    signal: AbortSignal.timeout(delivery.timeout_ms),
  })

  if (!response.ok) throw new Error(`responded ${response.status}`)
}

export async function drainHookDeliveries(db: Database, signature: string): Promise<number> {
  const due = await claimDue(db)

  for (const delivery of due) {
    try {
      await deliver(delivery, signature)
      await markDelivered(db, delivery.id)
    } catch (error) {
      await markFailed(db, delivery, String(error))
    }
  }

  return due.length
}

export function startHookDeliveryWorker(db: Database, signature: string): () => void {
  const timer = setInterval(() => {
    drainHookDeliveries(db, signature).catch((error) => {
      console.error('[gatekeeper] hook delivery worker', error)
    })
  }, POLL_INTERVAL_MS)

  return () => clearInterval(timer)
}
