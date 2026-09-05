import { boolean, index, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authSchema, citext, now, ts } from './base.ts'
import { realms } from './auth.ts'

export const ssoType = authSchema.enum('sso_type', ['saml', 'oidc'])

export const ssoProviders = authSchema.table(
  'sso_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    type: ssoType('type').notNull(),
    name: text('name').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: now(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('sso_providers_realm_idx').on(t.realmId)],
)

export const ssoDomains = authSchema.table(
  'sso_domains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ssoProviderId: uuid('sso_provider_id')
      .notNull()
      .references(() => ssoProviders.id, {
        onDelete: 'cascade',
      }),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    domain: citext('domain').notNull(),
  },
  (t) => [uniqueIndex('sso_domains_uq').on(t.realmId, t.domain)],
)

export const samlProviders = authSchema.table('saml_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ssoProviderId: uuid('sso_provider_id')
    .notNull()
    .references(() => ssoProviders.id, {
      onDelete: 'cascade',
    })
    .unique(),
  entityId: text('entity_id').notNull(),
  metadataXml: text('metadata_xml'),
  metadataUrl: text('metadata_url'),
  nameIdFormat: text('name_id_format'),
  attributeMapping: jsonb('attribute_mapping')
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  createdAt: now(),
})

export const oidcProviders = authSchema.table('oidc_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ssoProviderId: uuid('sso_provider_id')
    .notNull()
    .references(() => ssoProviders.id, {
      onDelete: 'cascade',
    })
    .unique(),
  issuer: text('issuer').notNull(),
  clientId: text('client_id').notNull(),
  clientSecretEncrypted: text('client_secret_encrypted').notNull(),
  keyId: uuid('key_id'),
  scopes: text('scopes')
    .array()
    .notNull()
    .default(sql`'{openid,profile,email}'::text[]`),
  claimMapping: jsonb('claim_mapping').$type<Record<string, string>>().notNull().default({}),
  createdAt: now(),
})

export const samlRelayStates = authSchema.table(
  'saml_relay_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ssoProviderId: uuid('sso_provider_id')
      .notNull()
      .references(() => ssoProviders.id, {
        onDelete: 'cascade',
      }),
    requestId: text('request_id').notNull(),
    forEmail: citext('for_email'),
    redirectTo: text('redirect_to'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [uniqueIndex('saml_relay_request_uq').on(t.requestId)],
)
