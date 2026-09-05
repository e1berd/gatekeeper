import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import {
  Email,
  PageInput,
  Paginated,
  Permission,
  Realm,
  Role,
  RoleAssignment,
  Scope,
  Session,
  Slug,
  User,
  UserStatus,
  Uuid,
} from '../schemas.ts'
import { RealmSettings } from '../settings.ts'
import { AdminErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/admin', tags: ['admin'] }))
const errs = { ...AdminErrors, ...TokenErrors }

const users = {
  list: base
    .meta(openapi({ method: 'GET', path: '/users' }))
    .errors(errs)
    .input(
      PageInput.extend({
        query: z.string().max(200).optional(),
        status: UserStatus.optional(),
        roleKey: Slug.optional(),
      }),
    )
    .output(Paginated(User)),

  get: base
    .meta(openapi({ method: 'GET', path: '/users/{userId}' }))
    .errors(errs)
    .input(z.object({ userId: Uuid }))
    .output(z.object({ user: User, roles: z.array(RoleAssignment) })),

  create: base
    .meta(openapi({ method: 'POST', path: '/users' }))
    .errors(errs)
    .input(
      z.object({
        email: Email.optional(),
        phone: z.string().max(32).optional(),
        password: z.string().min(8).max(256).optional(),
        emailVerified: z.boolean().default(false),
        userWritableMetadata: z.record(z.string(), z.unknown()).default({}),
        serverOnlyMetadata: z.record(z.string(), z.unknown()).default({}),
        sendInvite: z.boolean().default(false),
      }),
    )
    .output(z.object({ user: User })),

  update: base
    .meta(openapi({ method: 'PATCH', path: '/users/{userId}' }))
    .errors(errs)
    .input(
      z.object({
        userId: Uuid,
        email: Email.optional(),
        phone: z.string().max(32).optional(),
        emailVerified: z.boolean().optional(),
        status: UserStatus.optional(),
        userWritableMetadata: z.record(z.string(), z.unknown()).optional(),
        serverOnlyMetadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(z.object({ user: User })),

  remove: base
    .meta(openapi({ method: 'DELETE', path: '/users/{userId}' }))
    .errors(errs)
    .input(z.object({ userId: Uuid, hard: z.boolean().default(false) }))
    .output(z.object({ ok: z.literal(true) })),

  ban: base
    .meta(openapi({ method: 'POST', path: '/users/{userId}/ban' }))
    .errors(errs)
    .input(
      z.object({
        userId: Uuid,
        until: z.date().nullable().default(null),
        reason: z.string().optional(),
      }),
    )
    .output(z.object({ user: User })),

  setPassword: base
    .meta(openapi({ method: 'PUT', path: '/users/{userId}/password' }))
    .errors(errs)
    .input(
      z.object({
        userId: Uuid,
        password: z.string().min(8).max(256),
        revokeSessions: z.boolean().default(true),
      }),
    )
    .output(z.object({ ok: z.literal(true) })),

  listSessions: base
    .meta(openapi({ method: 'GET', path: '/users/{userId}/sessions' }))
    .errors(errs)
    .input(z.object({ userId: Uuid }))
    .output(z.object({ items: z.array(Session) })),

  revokeSessions: base
    .meta(openapi({ method: 'DELETE', path: '/users/{userId}/sessions' }))
    .errors(errs)
    .input(z.object({ userId: Uuid }))
    .output(z.object({ revoked: z.number().int() })),

  impersonate: base
    .meta(openapi({ method: 'POST', path: '/users/{userId}/impersonate' }))
    .errors(errs)
    .input(z.object({ userId: Uuid, ttl: z.number().int().min(60).max(3600).default(900) }))
    .output(z.object({ accessToken: z.string(), expiresIn: z.number().int() })),
}

const roles = {
  list: base
    .meta(openapi({ method: 'GET', path: '/roles' }))
    .errors(errs)
    .input(PageInput)
    .output(Paginated(Role)),

  get: base
    .meta(openapi({ method: 'GET', path: '/roles/{roleKey}' }))
    .errors(errs)
    .input(z.object({ roleKey: Slug }))
    .output(
      z.object({
        role: Role,
        permissions: z.array(Permission),
        inherits: z.array(Slug),
      }),
    ),

  create: base
    .meta(openapi({ method: 'POST', path: '/roles' }))
    .errors(errs)
    .input(
      z.object({
        key: Slug,
        name: z.string(),
        description: z.string().optional(),
        permissions: z.array(z.string()).default([]),
        inherits: z.array(Slug).default([]),
      }),
    )
    .output(z.object({ role: Role })),

  update: base
    .meta(openapi({ method: 'PATCH', path: '/roles/{roleKey}' }))
    .errors(errs)
    .input(
      z.object({
        roleKey: Slug,
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        permissions: z.array(z.string()).optional(),
        inherits: z.array(Slug).optional(),
      }),
    )
    .output(z.object({ role: Role })),

  remove: base
    .meta(openapi({ method: 'DELETE', path: '/roles/{roleKey}' }))
    .errors(errs)
    .input(z.object({ roleKey: Slug }))
    .output(z.object({ ok: z.literal(true) })),
}

const permissions = {
  list: base
    .meta(openapi({ method: 'GET', path: '/permissions' }))
    .errors(errs)
    .input(PageInput)
    .output(Paginated(Permission)),

  create: base
    .meta(openapi({ method: 'POST', path: '/permissions' }))
    .errors(errs)
    .input(z.object({ resource: Slug, action: Slug, description: z.string().optional() }))
    .output(z.object({ permission: Permission })),

  remove: base
    .meta(openapi({ method: 'DELETE', path: '/permissions/{permissionId}' }))
    .errors(errs)
    .input(z.object({ permissionId: Uuid }))
    .output(z.object({ ok: z.literal(true) })),
}

const grants = {
  grant: base
    .meta(openapi({ method: 'POST', path: '/grants' }))
    .errors(errs)
    .input(
      z.object({
        userId: Uuid,
        roleKey: Slug,
        scope: Scope.default({ type: 'global', id: null }),
        expiresAt: z.date().nullable().default(null),
      }),
    )
    .output(z.object({ assignment: RoleAssignment })),

  revoke: base
    .meta(openapi({ method: 'DELETE', path: '/grants' }))
    .errors(errs)
    .input(
      z.object({ userId: Uuid, roleKey: Slug, scope: Scope.default({ type: 'global', id: null }) }),
    )
    .output(z.object({ ok: z.literal(true) })),

  listForUser: base
    .meta(openapi({ method: 'GET', path: '/users/{userId}/grants' }))
    .errors(errs)
    .input(z.object({ userId: Uuid }))
    .output(z.object({ items: z.array(RoleAssignment) })),
}

const realms = {
  list: base
    .meta(openapi({ method: 'GET', path: '/realms' }))
    .errors(errs)
    .output(z.object({ items: z.array(Realm) })),

  create: base
    .meta(openapi({ method: 'POST', path: '/realms' }))
    .errors(errs)
    .input(z.object({ slug: Slug, name: z.string() }))
    .output(z.object({ realm: Realm })),

  update: base
    .meta(openapi({ method: 'PATCH', path: '/realms/{realmId}' }))
    .errors(errs)
    .input(
      z.object({
        realmId: Uuid,
        name: z.string().optional(),
        settings: RealmSettings.partial().optional(),
      }),
    )
    .output(z.object({ realm: Realm })),
}

export const AuditEntry = z.object({
  id: Uuid,
  actorId: Uuid.nullable(),
  action: z.string(),
  target: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
})

const audit = {
  list: base
    .meta(openapi({ method: 'GET', path: '/audit' }))
    .errors(errs)
    .input(
      PageInput.extend({
        actorId: Uuid.optional(),
        action: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }),
    )
    .output(Paginated(AuditEntry)),
}

export const admin = { users, roles, permissions, grants, realms, audit }
