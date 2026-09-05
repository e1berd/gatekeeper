import { boolean, index, integer, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { authSchema, ts } from './base.ts'
import { realms } from './auth.ts'

export const hookEvent = authSchema.enum('hook_event', [
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

export const hookKind = authSchema.enum('hook_kind', ['sql', 'http'])

export const hookDeliveryStatus = authSchema.enum('hook_delivery_status', [
  'pending',
  'delivered',
  'exhausted',
])

export const hooks = authSchema.table(
  'hooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    event: hookEvent('event').notNull(),
    kind: hookKind('kind').notNull(),
    runsInsideCallerTransaction: boolean('runs_inside_caller_transaction').notNull().default(false),
    target: text('target').notNull(),
    signingSecretEncrypted: text('signing_secret_encrypted'),
    keyId: uuid('key_id'),
    timeoutMs: integer('timeout_ms').notNull().default(3000),
    priority: integer('priority').notNull().default(100),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('hooks_realm_event_target_uq').on(t.realmId, t.event, t.target),
    index('hooks_dispatch_idx').on(t.realmId, t.event, t.enabled, t.priority),
  ],
)

export const hookDeliveries = authSchema.table(
  'hook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    hookId: uuid('hook_id')
      .notNull()
      .references(() => hooks.id, { onDelete: 'cascade' }),
    event: hookEvent('event').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status: hookDeliveryStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextAttemptAt: ts('next_attempt_at').notNull().defaultNow(),
    deliveredAt: ts('delivered_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('hook_deliveries_due_idx').on(t.status, t.nextAttemptAt),
    index('hook_deliveries_hook_idx').on(t.hookId),
  ],
)
