import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { Email, PageInput, Paginated, Slug, TokenPair, User, Uuid } from '../schemas.ts'
import { AdminErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/orgs', tags: ['organizations'] }))
const errs = { ...AdminErrors, ...TokenErrors }

export const Organization = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  ownerId: Uuid.nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
})

export const Membership = z.object({
  user: User,
  roleKey: Slug,
  joinedAt: z.date(),
  expiresAt: z.date().nullable(),
})

export const Invitation = z.object({
  id: Uuid,
  email: Email,
  roleKey: Slug,
  orgId: Uuid,
  invitedBy: Uuid.nullable(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const listMine = base
  .meta(openapi({ method: 'GET', path: '/', summary: 'Organizations I belong to' }))
  .errors(TokenErrors)
  .output(
    z.object({
      items: z.array(Organization.extend({ myRole: Slug })),
    }),
  )

export const create = base
  .meta(openapi({ method: 'POST', path: '/', summary: 'Create an organization' }))
  .errors({
    ...errs,
    QUOTA_EXCEEDED: {
      message: 'Organization limit reached for the current plan',
      data: z.object({ key: z.string(), limit: z.number().int(), used: z.number().int() }),
    },
  })
  .input(
    z.object({
      name: z.string().min(1).max(128),
      slug: Slug.optional(),
      metadata: z.record(z.string(), z.unknown()).default({}),
    }),
  )
  .output(z.object({ organization: Organization }))

export const get = base
  .meta(openapi({ method: 'GET', path: '/{orgId}' }))
  .errors(errs)
  .input(z.object({ orgId: Uuid }))
  .output(z.object({ organization: Organization, myRole: Slug }))

export const update = base
  .meta(openapi({ method: 'PATCH', path: '/{orgId}' }))
  .errors(errs)
  .input(
    z.object({
      orgId: Uuid,
      name: z.string().min(1).max(128).optional(),
      slug: Slug.optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .output(z.object({ organization: Organization }))

export const remove = base
  .meta(openapi({ method: 'DELETE', path: '/{orgId}' }))
  .errors(errs)
  .input(z.object({ orgId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const listMembers = base
  .meta(openapi({ method: 'GET', path: '/{orgId}/members' }))
  .errors(errs)
  .input(PageInput.extend({ orgId: Uuid }))
  .output(Paginated(Membership))

export const setMemberRole = base
  .meta(openapi({ method: 'PUT', path: '/{orgId}/members/{userId}/role' }))
  .errors({
    ...errs,
    LAST_OWNER: { message: 'An organization must keep at least one owner' },
  })
  .input(z.object({ orgId: Uuid, userId: Uuid, roleKey: Slug }))
  .output(z.object({ membership: Membership }))

export const removeMember = base
  .meta(openapi({ method: 'DELETE', path: '/{orgId}/members/{userId}' }))
  .errors({ ...errs, LAST_OWNER: { message: 'An organization must keep at least one owner' } })
  .input(z.object({ orgId: Uuid, userId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const leave = base
  .meta(openapi({ method: 'POST', path: '/{orgId}/leave' }))
  .errors({ ...errs, LAST_OWNER: { message: 'Transfer ownership before leaving' } })
  .input(z.object({ orgId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const transferOwnership = base
  .meta(openapi({ method: 'POST', path: '/{orgId}/transfer-ownership' }))
  .errors(errs)
  .input(z.object({ orgId: Uuid, toUserId: Uuid }))
  .output(z.object({ organization: Organization }))

export const invite = base
  .meta(openapi({ method: 'POST', path: '/{orgId}/invitations' }))
  .errors({
    ...errs,
    ALREADY_MEMBER: { message: 'User is already a member' },
    QUOTA_EXCEEDED: {
      message: 'Seat limit reached for the current plan',
      data: z.object({ key: z.string(), limit: z.number().int(), used: z.number().int() }),
    },
  })
  .input(
    z.object({
      orgId: Uuid,
      email: Email,
      roleKey: Slug.default('member'),
      redirectTo: z.url().optional(),
    }),
  )
  .output(z.object({ invitation: Invitation }))

export const listInvitations = base
  .meta(openapi({ method: 'GET', path: '/{orgId}/invitations' }))
  .errors(errs)
  .input(z.object({ orgId: Uuid }))
  .output(z.object({ items: z.array(Invitation) }))

export const revokeInvitation = base
  .meta(openapi({ method: 'DELETE', path: '/{orgId}/invitations/{invitationId}' }))
  .errors(errs)
  .input(z.object({ orgId: Uuid, invitationId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const acceptInvitation = oc
  .meta(openapi({ method: 'POST', path: '/invitations/accept', tags: ['organizations'] }))
  .errors({ ...errs, ...TokenErrors })
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(8).max(256).optional(),
    }),
  )
  .output(
    z.object({
      organization: Organization,
      roleKey: Slug,
      tokens: TokenPair.nullable(),
    }),
  )

export const org = {
  listMine,
  create,
  get,
  update,
  remove,
  listMembers,
  setMemberRole,
  removeMember,
  leave,
  transferOwnership,
  invite,
  listInvitations,
  revokeInvitation,
  acceptInvitation,
}
