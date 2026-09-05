import { index, inet, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { auditSchema } from './base.ts'
import { realms, users } from './auth.ts'

export const auditLog = auditSchema.table(
  'log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    onBehalfOfId: uuid('on_behalf_of_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    target: text('target'),
    outcome: text('outcome').notNull().default('success'),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_realm_created_idx').on(t.realmId, t.createdAt),
    index('audit_actor_idx').on(t.actorId, t.createdAt),
    index('audit_action_idx').on(t.action, t.createdAt),
  ],
)
