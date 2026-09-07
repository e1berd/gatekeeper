import { ORPCError } from '@orpc/server'
import {
  audienceFor,
  authed,
  pub,
  rateLimit,
  refuseWhileImpersonating,
  requireHumanVerification,
  requireRealm,
  requireUser,
} from '../middleware.ts'
import { todo } from '../lib/todo.ts'
import { config } from '../config-value.ts'
import { FlowError, type FlowEnv } from '../lib/flows.ts'
import { changePassword, signInPassword, signUp } from '../lib/password-auth.ts'
import { requestPasswordReset, resetPassword, verifyEmail } from '../lib/email-flows.ts'
import { beginOAuth, exchangeAuthorizationCode, type OAuthEnv } from '../lib/oauth.ts'
import { verifySignedPayload } from '../lib/signed-payload.ts'
import type { AuthenticatedUser, InitialContext, RealmContext } from '../context.ts'
import { listUserSessions, requireLiveSession, SessionError } from '../lib/session-records.ts'
import {
  describeSession,
  refreshSession,
  type SessionEnv,
  signOutSessions,
  switchOrganization,
} from '../lib/sessions.ts'

type AuthedContext = InitialContext & { realm?: RealmContext; user?: AuthenticatedUser }

type TokenErrorSet = {
  INVALID_TOKEN: () => Error
  TOKEN_REUSE_DETECTED: () => Error
  SESSION_REVOKED: () => Error
}

function sessionEnv(context: AuthedContext): SessionEnv {
  const realm = requireRealm(context)

  return {
    db: context.db,
    tokens: context.tokens,
    realmId: realm.realmId,
    realmSlug: realm.realmSlug,
    policy: realm.settings.tokens,
    audience: audienceFor(realm),
  }
}

function flowEnv(context: AuthedContext): FlowEnv {
  const realm = requireRealm(context)

  return {
    session: sessionEnv(context),
    settings: realm.settings,
    mailer: context.mailer,
    allowedRedirectOrigins: config.browser.allowedRedirectOrigins,
    issuer: config.issuer,
    ip: context.ip,
    userAgent: context.headers.get('user-agent'),
  }
}

function oauthEnv(context: AuthedContext): OAuthEnv {
  return {
    flow: flowEnv(context),
    db: context.db,
    secrets: context.secrets,
    providers: config.oauth,
    issuer: config.issuer,
    allowedRedirectOrigins: config.browser.allowedRedirectOrigins,
  }
}

function asFlowError(error: unknown, errors: Record<string, unknown>): never {
  if (!(error instanceof FlowError)) throw error

  const { code, ...data } = error.failure
  const options = Object.keys(data).length > 0 ? { data } : {}
  const factory = errors[code]

  if (typeof factory === 'function') throw (factory as (options: object) => Error)(options)

  throw new ORPCError(code, options)
}

async function runFlow<T>(errors: Record<string, unknown>, work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    return asFlowError(error, errors)
  }
}

function asTokenError(error: unknown, errors: TokenErrorSet): never {
  if (!(error instanceof SessionError)) throw error

  switch (error.reason) {
    case 'reuse_detected':
      throw errors.TOKEN_REUSE_DETECTED()
    case 'session_revoked':
      throw errors.SESSION_REVOKED()
    case 'invalid_token':
      throw errors.INVALID_TOKEN()
  }
}

async function currentSession(context: AuthedContext) {
  const user = requireUser(context)
  const realm = requireRealm(context)

  return await requireLiveSession(context.db, user.sessionId, realm.settings.tokens)
}

export const auth = {
  signUp: pub.auth.signUp
    .use(rateLimit('sign_up'))
    .use(requireHumanVerification('sign_up'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => signUp(flowEnv(context), input)),
    ),
  signInPassword: pub.auth.signInPassword
    .use(rateLimit('sign_in_password'))
    .use(requireHumanVerification('sign_in_password'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => signInPassword(flowEnv(context), input)),
    ),
  signInOtp: pub.auth.signInOtp
    .use(rateLimit('sign_in_otp'))
    .use(requireHumanVerification('sign_in_otp'))
    .handler(todo('auth.signInOtp')),
  verifyOtp: pub.auth.verifyOtp.use(rateLimit('verify_otp')).handler(todo('auth.verifyOtp')),

  refresh: pub.auth.refresh
    .use(rateLimit('refresh'))
    .handler(async ({ context, input, errors }) => {
      try {
        return await refreshSession(sessionEnv(context), input.refreshToken)
      } catch (error) {
        return asTokenError(error, errors)
      }
    }),

  signOut: authed.auth.signOut.handler(async ({ context, input }) => {
    const user = requireUser(context)

    return { revoked: await signOutSessions(context.db, user.id, input.scope, user.sessionId) }
  }),

  getSession: authed.auth.getSession.handler(async ({ context, errors }) => {
    try {
      return await describeSession(context.db, await currentSession(context))
    } catch (error) {
      return asTokenError(error, errors)
    }
  }),

  verifyEmail: pub.auth.verifyEmail
    .use(rateLimit('verify_email'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => verifyEmail(flowEnv(context), input.token)),
    ),
  requestPasswordReset: pub.auth.requestPasswordReset
    .use(rateLimit('password_reset'))
    .use(requireHumanVerification('password_reset'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => requestPasswordReset(flowEnv(context), input)),
    ),
  resetPassword: pub.auth.resetPassword
    .use(rateLimit('password_reset_confirm'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => resetPassword(flowEnv(context), input)),
    ),
  changePassword: authed.auth.changePassword
    .use(refuseWhileImpersonating)
    .handler(({ context, input, errors }) => {
      const user = requireUser(context)

      return runFlow(errors, () => changePassword(flowEnv(context), user.id, user.sessionId, input))
    }),

  listSessions: authed.auth.listSessions.handler(async ({ context }) => {
    const user = requireUser(context)

    return {
      items: await listUserSessions(context.db, user.id),
      currentSessionId: user.sessionId,
    }
  }),

  revokeSession: authed.auth.revokeSession.handler(async ({ context, input }) => {
    const user = requireUser(context)
    await signOutSessions(context.db, user.id, 'local', input.sessionId)

    return { ok: true } as const
  }),

  oauthStart: pub.auth.oauthStart
    .use(rateLimit('oauth_start'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => beginOAuth(oauthEnv(context), input)),
    ),
  oauthExchange: pub.auth.oauthExchange
    .use(rateLimit('oauth_exchange'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => exchangeAuthorizationCode(oauthEnv(context), input)),
    ),

  verifySignedPayload: pub.auth.verifySignedPayload
    .use(rateLimit('signed_payload'))
    .handler(({ context, input, errors }) =>
      runFlow(errors, () => verifySignedPayload(flowEnv(context), config.signedPayload, input)),
    ),

  switchOrg: authed.auth.switchOrg.handler(async ({ context, input, errors }) => {
    try {
      const minted = await switchOrganization(
        sessionEnv(context),
        await currentSession(context),
        input.orgId,
      )

      if (!minted) {
        throw new ORPCError('FORBIDDEN', { message: 'Not a member of that organization' })
      }

      return {
        accessToken: minted.accessToken,
        expiresIn: minted.expiresIn,
        activeOrgId: minted.activeOrgId,
        roles: minted.roles,
      }
    } catch (error) {
      return asTokenError(error, errors)
    }
  }),
}
