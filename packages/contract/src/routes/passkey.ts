import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { AuthResult, Uuid } from '../schemas.ts'
import { AuthErrors, MfaErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/passkey', tags: ['passkey'] }))

const PublicKeyCredentialJSON = z.record(z.string(), z.unknown())

export const Passkey = z.object({
  id: Uuid,
  name: z.string().nullable(),
  aaguid: z.string().nullable(),
  transports: z.array(z.string()),
  backedUp: z.boolean(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
})

export const registerOptions = base
  .meta(openapi({ method: 'POST', path: '/register/options', summary: 'Begin passkey enrolment' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ name: z.string().max(64).optional() }))
  .output(z.object({ options: PublicKeyCredentialJSON, challengeId: Uuid }))

export const registerVerify = base
  .meta(openapi({ method: 'POST', path: '/register/verify' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(
    z.object({
      challengeId: Uuid,
      response: PublicKeyCredentialJSON,
      name: z.string().max(64).optional(),
    }),
  )
  .output(z.object({ passkey: Passkey }))

export const authenticateOptions = base
  .meta(openapi({ method: 'POST', path: '/authenticate/options' }))
  .errors(AuthErrors)
  .input(z.object({ email: z.email().optional() }))
  .output(z.object({ options: PublicKeyCredentialJSON, challengeId: Uuid }))

export const authenticateVerify = base
  .meta(openapi({ method: 'POST', path: '/authenticate/verify' }))
  .errors({ ...AuthErrors, ...MfaErrors })
  .input(z.object({ challengeId: Uuid, response: PublicKeyCredentialJSON }))
  .output(AuthResult)

export const list = base
  .meta(openapi({ method: 'GET', path: '/' }))
  .errors(TokenErrors)
  .output(z.object({ items: z.array(Passkey) }))

export const rename = base
  .meta(openapi({ method: 'PATCH', path: '/{passkeyId}' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ passkeyId: Uuid, name: z.string().max(64) }))
  .output(z.object({ passkey: Passkey }))

export const remove = base
  .meta(openapi({ method: 'DELETE', path: '/{passkeyId}' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ passkeyId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const passkey = {
  registerOptions,
  registerVerify,
  authenticateOptions,
  authenticateVerify,
  list,
  rename,
  remove,
}
