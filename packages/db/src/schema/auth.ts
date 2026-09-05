import { index, integer, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authSchema, citext, now, ts } from './base.ts'

export const userStatus = authSchema.enum('user_status', [
  'active',
  'pending',
  'locked',
  'disabled',
])

export const realms = authSchema.table('realms', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: now(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})

export const users = authSchema.table(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),

    email: citext('email'),
    emailVerifiedAt: ts('email_verified_at'),
    phone: text('phone'),
    phoneVerifiedAt: ts('phone_verified_at'),

    passwordHash: text('password_hash'),
    passwordChangedAt: ts('password_changed_at'),

    status: userStatus('status').notNull().default('active'),
    bannedUntil: ts('banned_until'),

    userWritableMetadata: jsonb('user_metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    serverOnlyMetadata: jsonb('app_metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    avatarUrl: text('avatar_url'),

    permissionsVersion: integer('permissions_version').notNull().default(1),

    failedAttempts: integer('failed_attempts').notNull().default(0),
    lastFailedAt: ts('last_failed_at'),

    lastSignInAt: ts('last_sign_in_at'),
    deletedAt: ts('deleted_at'),
    createdAt: now(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('users_realm_email_uq')
      .on(t.realmId, t.email)
      .where(sql`${t.deletedAt} is null`),
    uniqueIndex('users_realm_phone_uq')
      .on(t.realmId, t.phone)
      .where(sql`${t.deletedAt} is null`),
    index('users_realm_created_idx').on(t.realmId, t.createdAt),
  ],
)

export const identities = authSchema.table(
  'identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    identityData: jsonb('identity_data').$type<Record<string, unknown>>().notNull().default({}),
    email: citext('email'),
    lastSignInAt: ts('last_sign_in_at'),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('identities_provider_uq').on(t.realmId, t.provider, t.providerUserId),
    index('identities_user_idx').on(t.userId),
  ],
)
