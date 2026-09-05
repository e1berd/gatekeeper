import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import {
  AuthResult,
  Email,
  HumanVerificationToken,
  Session,
  Slug,
  TokenPair,
  User,
} from '../schemas.ts'
import { AuthErrors, HumanVerificationErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/auth', tags: ['auth'] }))

export const signUp = base
  .meta(openapi({ method: 'POST', path: '/sign-up', summary: 'Register with email and password' }))
  .errors({
    ...AuthErrors,
    ...HumanVerificationErrors,
    EMAIL_TAKEN: { message: 'Email already registered' },
  })
  .input(
    z.object({
      email: Email,
      password: z.string().min(8).max(256),
      userWritableMetadata: z.record(z.string(), z.unknown()).default({}),
      redirectTo: z.url().optional(),
      humanVerification: HumanVerificationToken.optional(),
    }),
  )
  .output(AuthResult)

export const signInPassword = base
  .meta(openapi({ method: 'POST', path: '/sign-in/password', summary: 'Sign in with a password' }))
  .errors({ ...AuthErrors, ...HumanVerificationErrors })
  .input(
    z.object({
      email: Email,
      password: z.string().max(256),
      humanVerification: HumanVerificationToken.optional(),
    }),
  )
  .output(AuthResult)

export const signInOtp = base
  .meta(openapi({ method: 'POST', path: '/sign-in/otp', summary: 'Request an email or SMS OTP' }))
  .errors({ ...AuthErrors, ...HumanVerificationErrors })
  .input(
    z.object({
      channel: z.enum(['email', 'sms']),
      identifier: z.string().max(320),
      shouldCreateUser: z.boolean().default(true),
      humanVerification: HumanVerificationToken.optional(),
    }),
  )
  .output(z.object({ sent: z.literal(true), expiresIn: z.number().int() }))

export const verifyOtp = base
  .meta(openapi({ method: 'POST', path: '/verify-otp', summary: 'Exchange an OTP for tokens' }))
  .errors({ ...AuthErrors, ...TokenErrors })
  .input(
    z.object({
      channel: z.enum(['email', 'sms']),
      identifier: z.string().max(320),
      code: z.string().min(4).max(12),
    }),
  )
  .output(AuthResult)

export const refresh = base
  .meta(openapi({ method: 'POST', path: '/refresh', summary: 'Rotate a refresh token' }))
  .errors(TokenErrors)
  .input(z.object({ refreshToken: z.string() }))
  .output(TokenPair)

export const signOut = base
  .meta(openapi({ method: 'POST', path: '/sign-out', summary: 'Revoke the current session' }))
  .errors(TokenErrors)
  .input(
    z.object({
      scope: z.enum(['local', 'global']).default('local'),
    }),
  )
  .output(z.object({ revoked: z.number().int() }))

export const getSession = base
  .meta(openapi({ method: 'GET', path: '/session', summary: 'Describe the current session' }))
  .errors(TokenErrors)
  .output(z.object({ user: User, session: Session }))

export const verifyEmail = base
  .meta(openapi({ method: 'POST', path: '/verify-email' }))
  .errors(TokenErrors)
  .input(z.object({ token: z.string() }))
  .output(AuthResult)

export const requestPasswordReset = base
  .meta(openapi({ method: 'POST', path: '/password/reset-request' }))
  .errors({ ...AuthErrors, ...HumanVerificationErrors })
  .input(
    z.object({
      email: Email,
      redirectTo: z.url().optional(),
      humanVerification: HumanVerificationToken.optional(),
    }),
  )
  .output(z.object({ sent: z.literal(true) }))

export const resetPassword = base
  .meta(openapi({ method: 'POST', path: '/password/reset' }))
  .errors({ ...AuthErrors, ...TokenErrors })
  .input(z.object({ token: z.string(), password: z.string().min(8).max(256) }))
  .output(z.object({ ok: z.literal(true) }))

export const changePassword = base
  .meta(openapi({ method: 'POST', path: '/password/change' }))
  .errors({ ...AuthErrors, ...TokenErrors })
  .input(
    z.object({
      currentPassword: z.string().max(256).nullable(),
      newPassword: z.string().min(8).max(256),
      revokeOtherSessions: z.boolean().default(true),
    }),
  )
  .output(z.object({ ok: z.literal(true), revoked: z.number().int() }))

export const listSessions = base
  .meta(openapi({ method: 'GET', path: '/sessions', summary: 'List my active sessions' }))
  .errors(TokenErrors)
  .output(z.object({ items: z.array(Session), currentSessionId: z.uuid() }))

export const revokeSession = base
  .meta(openapi({ method: 'DELETE', path: '/sessions/{sessionId}' }))
  .errors(TokenErrors)
  .input(z.object({ sessionId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))

export const oauthStart = base
  .meta(openapi({ method: 'POST', path: '/oauth/{provider}/start' }))
  .errors(AuthErrors)
  .input(
    z.object({
      provider: Slug,
      redirectTo: z.url().optional(),
      codeChallenge: z.string().min(43).max(128).optional(),
    }),
  )
  .output(z.object({ authorizationUrl: z.url(), state: z.string() }))

export const oauthExchange = base
  .meta(openapi({ method: 'POST', path: '/oauth/exchange' }))
  .errors({ ...AuthErrors, ...TokenErrors })
  .input(z.object({ code: z.string(), codeVerifier: z.string().min(43).max(128).optional() }))
  .output(AuthResult)

export const switchOrg = base
  .meta(
    openapi({
      method: 'POST',
      path: '/switch-org',
      summary: 'Rebind the token to an organization',
    }),
  )
  .errors({ ...AuthErrors, ...TokenErrors })
  .input(z.object({ orgId: z.uuid().nullable() }))
  .output(
    z.object({
      accessToken: z.string(),
      expiresIn: z.number().int(),
      activeOrgId: z.uuid().nullable(),
      roles: z.array(Slug),
    }),
  )

export const auth = {
  signUp,
  signInPassword,
  signInOtp,
  verifyOtp,
  refresh,
  signOut,
  getSession,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  listSessions,
  revokeSession,
  oauthStart,
  oauthExchange,
  switchOrg,
}
