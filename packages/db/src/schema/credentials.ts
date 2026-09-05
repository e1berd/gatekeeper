import { bigint, boolean, index, inet, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authSchema, now, ts } from './base.ts'
import { realms, users } from './auth.ts'

export const factorType = authSchema.enum('factor_type', ['totp', 'webauthn', 'recovery_code'])
export const factorStatus = authSchema.enum('factor_status', ['unverified', 'verified'])

export const mfaFactors = authSchema.table(
  'mfa_factors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: factorType('type').notNull(),
    status: factorStatus('status').notNull().default('unverified'),
    friendlyName: text('friendly_name'),
    secretEncrypted: text('secret_encrypted'),
    keyId: uuid('key_id'),
    lastUsedAt: ts('last_used_at'),
    createdAt: now(),
  },
  (t) => [index('mfa_factors_user_idx').on(t.userId)],
)

export const webauthnCredentials = authSchema.table(
  'webauthn_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    credentialId: text('credential_id').notNull(),
    publicKey: text('public_key').notNull(),
    signCount: bigint('sign_count', { mode: 'number' }).notNull().default(0),
    transports: text('transports')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    aaguid: uuid('aaguid'),
    backupEligible: boolean('backup_eligible').notNull().default(false),
    backupState: boolean('backup_state').notNull().default(false),
    attestationFmt: text('attestation_fmt'),
    name: text('name'),
    lastUsedAt: ts('last_used_at'),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('webauthn_credential_id_uq').on(t.credentialId),
    index('webauthn_user_idx').on(t.userId),
  ],
)

export const challenges = authSchema.table(
  'challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    ip: inet('ip'),
    verifiedAt: ts('verified_at'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [index('challenges_expiry_idx').on(t.expiresAt)],
)
