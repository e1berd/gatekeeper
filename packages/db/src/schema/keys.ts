import { boolean, jsonb, text, uuid } from 'drizzle-orm/pg-core'
import { authSchema, now, ts } from './base.ts'
import { realms } from './auth.ts'

export const signingKeys = authSchema.table('signing_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  realmId: uuid('realm_id').references(() => realms.id, { onDelete: 'cascade' }),
  kid: text('kid').notNull().unique(),
  algorithm: text('algorithm').notNull().default('EdDSA'),
  publicJwk: jsonb('public_jwk').$type<Record<string, unknown>>().notNull(),
  privateKeyEncrypted: text('private_key_encrypted').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  rotatedAt: ts('rotated_at'),
  expiresAt: ts('expires_at'),
  createdAt: now(),
})

export const encryptionKeys = authSchema.table('encryption_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  realmId: uuid('realm_id').references(() => realms.id, { onDelete: 'cascade' }),
  wrappedDek: text('wrapped_dek').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  rotatedAt: ts('rotated_at'),
  createdAt: now(),
})
