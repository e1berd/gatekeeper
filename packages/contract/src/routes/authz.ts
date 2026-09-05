import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { RoleAssignment, Scope, Slug, Uuid } from '../schemas.ts'
import { AdminErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/authz', tags: ['authz'] }))

export const Check = z.object({
  subject: Uuid,
  permission: z.string().regex(/^[a-z0-9._-]+:[a-z0-9._-]+$/),
  scope: Scope.default({ type: 'global', id: null }),
})

export const Decision = z.object({
  allowed: z.boolean(),
  via: z
    .object({
      roleKey: Slug,
      scope: Scope,
      inheritedFrom: Slug.nullable(),
    })
    .nullable(),
})

export const check = base
  .meta(openapi({ method: 'POST', path: '/check', summary: 'Answer one authorization question' }))
  .errors({ ...TokenErrors, ...AdminErrors })
  .input(Check)
  .output(Decision)

export const checkBulk = base
  .meta(openapi({ method: 'POST', path: '/check-bulk' }))
  .errors({ ...TokenErrors, ...AdminErrors })
  .input(z.object({ checks: z.array(Check).min(1).max(256) }))
  .output(z.object({ decisions: z.array(Decision) }))

export const effectivePermissions = base
  .meta(openapi({ method: 'GET', path: '/effective-permissions/{subject}' }))
  .errors({ ...TokenErrors, ...AdminErrors })
  .input(z.object({ subject: Uuid, scope: Scope.optional() }))
  .output(
    z.object({
      permissions: z.array(z.string()),
      roles: z.array(RoleAssignment),
      version: z.number().int(),
    }),
  )

export const listSubjectsWithPermission = base
  .meta(openapi({ method: 'POST', path: '/subjects' }))
  .errors({ ...TokenErrors, ...AdminErrors })
  .input(
    z.object({
      permission: z.string(),
      scope: Scope.default({ type: 'global', id: null }),
      limit: z.number().int().min(1).max(500).default(100),
    }),
  )
  .output(z.object({ subjects: z.array(Uuid) }))

export const authz = { check, checkBulk, effectivePermissions, listSubjectsWithPermission }
