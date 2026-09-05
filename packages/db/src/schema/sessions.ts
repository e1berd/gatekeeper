import { index, inet, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authSchema, now, ts } from './base.ts'
import { realms, users } from './auth.ts'

export const aal = authSchema.enum('aal', ['aal1', 'aal2', 'aal3'])

export const oneTimeTokenType = authSchema.enum('one_time_token_type', [
  'confirmation',
  'recovery',
  'email_change',
  'phone_change',
  'invite',
  'reauthentication',
])

export const sessions = authSchema.table(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    aal: aal('aal').notNull().default('aal1'),
    amr: text('amr')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    deviceId: text('device_id'),
    notAfter: ts('not_after'),
    refreshedAt: ts('refreshed_at').notNull().defaultNow(),
    revokedAt: ts('revoked_at'),
    createdAt: now(),
  },
  (t) => [
    index('sessions_user_idx').on(t.userId),
    index('sessions_active_idx')
      .on(t.userId)
      .where(sql`${t.revokedAt} is null`),
  ],
)

export const refreshTokens = authSchema.table(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    parentHash: text('parent_hash'),
    usedAt: ts('used_at'),
    revokedAt: ts('revoked_at'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('refresh_tokens_hash_uq').on(t.tokenHash),
    index('refresh_tokens_session_idx').on(t.sessionId),
  ],
)

export const flowState = authSchema.table(
  'flow_state',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    authCode: text('auth_code').notNull(),
    codeChallenge: text('code_challenge'),
    codeChallengeMethod: text('code_challenge_method'),
    providerType: text('provider_type').notNull(),
    redirectTo: text('redirect_to'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [uniqueIndex('flow_state_code_uq').on(t.authCode)],
)

export const oneTimeTokens = authSchema.table(
  'one_time_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: oneTimeTokenType('type').notNull(),
    tokenHash: text('token_hash').notNull(),
    relatesTo: text('relates_to'),
    consumedAt: ts('consumed_at'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('one_time_tokens_hash_uq').on(t.tokenHash),
    index('one_time_tokens_user_type_idx').on(t.userId, t.type),
  ],
)
