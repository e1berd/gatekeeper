import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { AuthResult, FactorType, Uuid } from '../schemas.ts'
import { MfaErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/mfa', tags: ['mfa'] }))

export const Factor = z.object({
  id: Uuid,
  type: FactorType,
  name: z.string().nullable(),
  verified: z.boolean(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
})

export const enrollTotp = base
  .meta(openapi({ method: 'POST', path: '/totp/enroll', summary: 'Start TOTP enrolment' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ name: z.string().max(64).optional() }))
  .output(
    z.object({
      factorId: Uuid,
      secret: z.string(),
      otpauthUri: z.string(),
      qrCodeSvg: z.string(),
    }),
  )

export const verifyTotpEnrolment = base
  .meta(openapi({ method: 'POST', path: '/totp/verify' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ factorId: Uuid, code: z.string().length(6) }))
  .output(z.object({ factor: Factor, recoveryCodes: z.array(z.string()) }))

export const verifyChallenge = base
  .meta(openapi({ method: 'POST', path: '/challenge/verify' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(
    z.object({
      challengeToken: z.string(),
      factorId: Uuid,
      code: z.string().min(6).max(16),
    }),
  )
  .output(AuthResult)

export const stepUp = base
  .meta(openapi({ method: 'POST', path: '/step-up' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ factorId: Uuid, code: z.string().min(6).max(16) }))
  .output(z.object({ accessToken: z.string(), expiresIn: z.number().int() }))

export const listFactors = base
  .meta(openapi({ method: 'GET', path: '/factors' }))
  .errors(TokenErrors)
  .output(z.object({ items: z.array(Factor) }))

export const removeFactor = base
  .meta(openapi({ method: 'DELETE', path: '/factors/{factorId}' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .input(z.object({ factorId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const regenerateRecoveryCodes = base
  .meta(openapi({ method: 'POST', path: '/recovery-codes' }))
  .errors({ ...TokenErrors, ...MfaErrors })
  .output(z.object({ codes: z.array(z.string()) }))

export const mfa = {
  enrollTotp,
  verifyTotpEnrolment,
  verifyChallenge,
  stepUp,
  listFactors,
  removeFactor,
  regenerateRecoveryCodes,
}
