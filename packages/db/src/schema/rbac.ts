import {
  boolean,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { now, rbacSchema, ts } from './base.ts'
import { realms, users } from './auth.ts'

export const scopeType = rbacSchema.enum('scope_type', ['global', 'org', 'resource'])

export const organizations = rbacSchema.table(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    deletedAt: ts('deleted_at'),
    createdAt: now(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('org_realm_slug_uq')
      .on(t.realmId, t.slug)
      .where(sql`${t.deletedAt} is null`),
    index('org_owner_idx').on(t.ownerId),
  ],
)

export const permissions = rbacSchema.table(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    description: text('description'),
    createdAt: now(),
  },
  (t) => [uniqueIndex('permissions_uq').on(t.realmId, t.resource, t.action)],
)

export const roles = rbacSchema.table(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    grantableAt: scopeType('grantable_at').notNull().default('global'),
    createdAt: now(),
  },
  (t) => [uniqueIndex('roles_realm_key_uq').on(t.realmId, t.key)],
)

export const rolePermissions = rbacSchema.table(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, {
        onDelete: 'cascade',
      }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
)

export const roleParents = rbacSchema.table(
  'role_parents',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    parentRoleId: uuid('parent_role_id')
      .notNull()
      .references(() => roles.id, {
        onDelete: 'cascade',
      }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.parentRoleId] })],
)

export const groups = rbacSchema.table(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    createdAt: now(),
  },
  (t) => [uniqueIndex('groups_realm_name_uq').on(t.realmId, t.name)],
)

export const userGroups = rbacSchema.table(
  'user_groups',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
)

export const userRoles = rbacSchema.table(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    scopeType: scopeType('scope_type').notNull().default('global'),
    scopeId: text('scope_id'),
    expiresAt: ts('expires_at'),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('user_roles_uq').on(t.userId, t.roleId, t.scopeType, t.scopeId),
    index('user_roles_user_idx').on(t.userId),
    index('user_roles_scope_idx').on(t.scopeType, t.scopeId),
  ],
)

export const groupRoles = rbacSchema.table(
  'group_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    scopeType: scopeType('scope_type').notNull().default('global'),
    scopeId: text('scope_id'),
  },
  (t) => [uniqueIndex('group_roles_uq').on(t.groupId, t.roleId, t.scopeType, t.scopeId)],
)

export const invitations = rbacSchema.table(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    scopeType: scopeType('scope_type').notNull().default('org'),
    scopeId: text('scope_id'),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    tokenHash: text('token_hash').notNull(),
    acceptedAt: ts('accepted_at'),
    acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
    revokedAt: ts('revoked_at'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex('invitations_token_uq').on(t.tokenHash),
    uniqueIndex('invitations_pending_uq')
      .on(t.realmId, t.email, t.scopeType, t.scopeId)
      .where(sql`${t.acceptedAt} is null and ${t.revokedAt} is null`),
    index('invitations_scope_idx').on(t.scopeType, t.scopeId),
  ],
)

export const entitlements = rbacSchema.table(
  'entitlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    realmId: uuid('realm_id')
      .notNull()
      .references(() => realms.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    key: text('key').notNull(),
    limit: integer('limit'),
    source: text('source').notNull().default('plan'),
    expiresAt: ts('expires_at'),
    createdAt: now(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('entitlements_uq').on(t.subjectType, t.subjectId, t.key),
    index('entitlements_subject_idx').on(t.subjectType, t.subjectId),
  ],
)
