import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { Email, Identity, Slug, User } from '../schemas.ts'
import { ProfileErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/auth/me', tags: ['profile'] }))
const errs = { ...ProfileErrors, ...TokenErrors }

export const get = base
  .meta(openapi({ method: 'GET', path: '/', summary: 'Describe the signed-in user' }))
  .errors(TokenErrors)
  .output(z.object({ user: User }))

export const update = base
  .meta(openapi({ method: 'PATCH', path: '/', summary: 'Edit my own profile' }))
  .errors(errs)
  .input(
    z.object({
      userWritableMetadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .output(z.object({ user: User }))

export const uploadAvatar = base
  .meta(
    openapi({
      method: 'PUT',
      path: '/avatar',
      summary: 'Replace my avatar with a PNG, JPEG or WebP up to 512 KiB',
    }),
  )
  .errors(errs)
  .input(z.file())
  .output(z.object({ user: User }))

export const removeAvatar = base
  .meta(openapi({ method: 'DELETE', path: '/avatar', summary: 'Delete my avatar' }))
  .errors(errs)
  .output(z.object({ user: User }))

export const requestEmailChange = base
  .meta(openapi({ method: 'POST', path: '/email', summary: 'Start changing my email address' }))
  .errors(errs)
  .input(z.object({ newEmail: Email, redirectTo: z.url().optional() }))
  .output(z.object({ sent: z.literal(true) }))

export const confirmEmailChange = base
  .meta(
    openapi({ method: 'POST', path: '/email/confirm', summary: 'Confirm a pending email change' }),
  )
  .errors(errs)
  .input(z.object({ token: z.string() }))
  .output(z.object({ user: User }))

export const requestPhoneChange = base
  .meta(openapi({ method: 'POST', path: '/phone', summary: 'Start changing my phone number' }))
  .errors(errs)
  .input(z.object({ newPhone: z.string().max(32) }))
  .output(z.object({ sent: z.literal(true) }))

export const confirmPhoneChange = base
  .meta(
    openapi({ method: 'POST', path: '/phone/confirm', summary: 'Confirm a pending phone change' }),
  )
  .errors(errs)
  .input(z.object({ code: z.string().min(4).max(12) }))
  .output(z.object({ user: User }))

export const listIdentities = base
  .meta(
    openapi({ method: 'GET', path: '/identities', summary: 'List my linked sign-in providers' }),
  )
  .errors(TokenErrors)
  .output(z.object({ items: z.array(Identity) }))

export const linkProvider = base
  .meta(
    openapi({
      method: 'POST',
      path: '/identities/{provider}',
      summary: 'Begin linking another social provider',
    }),
  )
  .errors(errs)
  .input(z.object({ provider: Slug, redirectTo: z.url().optional() }))
  .output(z.object({ authorizationUrl: z.url(), state: z.string() }))

export const unlinkProvider = base
  .meta(
    openapi({
      method: 'DELETE',
      path: '/identities/{identityId}',
      summary: 'Unlink a social provider',
    }),
  )
  .errors(errs)
  .input(z.object({ identityId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))

export const profile = {
  get,
  update,
  uploadAvatar,
  removeAvatar,
  requestEmailChange,
  confirmEmailChange,
  requestPhoneChange,
  confirmPhoneChange,
  listIdentities,
  linkProvider,
  unlinkProvider,
}
