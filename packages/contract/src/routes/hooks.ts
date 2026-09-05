import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { PageInput, Paginated, Uuid } from '../schemas.ts'
import { AdminErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/admin/hooks', tags: ['hooks'] }))
const errs = { ...AdminErrors, ...TokenErrors }

export const HookEvent = z.enum([
  'before_sign_up',
  'after_sign_up',
  'before_sign_in',
  'after_sign_in',
  'before_token_issue',
  'before_org_create',
  'after_org_create',
  'after_invite_accepted',
  'before_password_change',
])

export const QualifiedFunctionName = z
  .string()
  .regex(/^[a-z_][a-z0-9_]{0,62}\.[a-z_][a-z0-9_]{0,62}$/)

export const Hook = z.object({
  id: Uuid,
  realmId: Uuid,
  event: HookEvent,
  kind: z.enum(['sql', 'http']),
  target: z.string(),
  runsInsideCallerTransaction: z.boolean(),
  timeoutMs: z.number().int(),
  priority: z.number().int(),
  enabled: z.boolean(),
  createdAt: z.date(),
})

export const HookDelivery = z.object({
  id: Uuid,
  hookId: Uuid,
  event: HookEvent,
  status: z.enum(['pending', 'delivered', 'exhausted']),
  attempts: z.number().int(),
  lastError: z.string().nullable(),
  nextAttemptAt: z.date(),
  deliveredAt: z.date().nullable(),
  createdAt: z.date(),
})

export const list = base
  .meta(openapi({ method: 'GET', path: '/' }))
  .errors(errs)
  .input(z.object({ event: HookEvent.optional() }))
  .output(z.object({ items: z.array(Hook) }))

export const create = base
  .meta(openapi({ method: 'POST', path: '/' }))
  .errors(errs)
  .input(
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('sql'),
        event: HookEvent,
        target: QualifiedFunctionName,
        runsInsideCallerTransaction: z.boolean().default(true),
        priority: z.number().int().default(100),
      }),
      z.object({
        kind: z.literal('http'),
        event: HookEvent,
        target: z.url(),
        signingSecret: z.string().min(32),
        timeoutMs: z.number().int().min(100).max(10_000).default(3000),
        priority: z.number().int().default(100),
      }),
    ]),
  )
  .output(z.object({ hook: Hook }))

export const update = base
  .meta(openapi({ method: 'PATCH', path: '/{hookId}' }))
  .errors(errs)
  .input(
    z.object({
      hookId: Uuid,
      enabled: z.boolean().optional(),
      priority: z.number().int().optional(),
      timeoutMs: z.number().int().min(100).max(10_000).optional(),
    }),
  )
  .output(z.object({ hook: Hook }))

export const remove = base
  .meta(openapi({ method: 'DELETE', path: '/{hookId}' }))
  .errors(errs)
  .input(z.object({ hookId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const listDeliveries = base
  .meta(openapi({ method: 'GET', path: '/deliveries' }))
  .errors(errs)
  .input(
    PageInput.extend({
      hookId: Uuid.optional(),
      status: z.enum(['pending', 'delivered', 'exhausted']).optional(),
    }),
  )
  .output(Paginated(HookDelivery))

export const retryDelivery = base
  .meta(openapi({ method: 'POST', path: '/deliveries/{deliveryId}/retry' }))
  .errors(errs)
  .input(z.object({ deliveryId: Uuid }))
  .output(z.object({ delivery: HookDelivery }))

export const hooks = { list, create, update, remove, listDeliveries, retryDelivery }
