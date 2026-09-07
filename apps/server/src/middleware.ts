import { implement, ORPCError } from '@orpc/server'
import { contract } from '@gatekeeper/contract'
import type { HumanVerificationAction, Scope } from '@gatekeeper/contract'
import type { AuthenticatedUser, InitialContext, RealmContext } from './context.ts'
import { config } from './config-value.ts'
import { resolveRealmBySlug } from './lib/realm.ts'
import { hasPermission } from './lib/authz.ts'
import { requireLiveSession, SessionError } from './lib/session-records.ts'
import { checkRateLimit } from './lib/rate-limit.ts'
import { HumanVerificationError } from './lib/human-verification.ts'

const BEARER = 'Bearer '

export const os = implement(contract).$context<
  InitialContext & {
    user?: AuthenticatedUser
    realm?: RealmContext
    authResolved?: boolean
    realmResolved?: boolean
  }
>()

export const resolveRealm = os.middleware(async ({ context, next }) => {
  if (context.realmResolved && context.realm) {
    return next({ context: { realm: context.realm, realmResolved: true } })
  }

  const slug = context.headers.get('x-gatekeeper-realm') ?? 'master'
  const realm = await resolveRealmBySlug(context.db, slug)

  if (!realm) {
    throw new ORPCError('NOT_FOUND', { message: `Unknown realm: ${slug}` })
  }

  return next({ context: { realm, realmResolved: true } })
})

/** The `aud` a realm mints and accepts. Falls back to the deployment issuer. */
export function audienceFor(realm: RealmContext): string {
  return realm.settings.tokens.audience ?? config.issuer
}

export function requireRealm(context: { realm?: RealmContext }): RealmContext {
  if (!context.realm) throw new ORPCError('UNAUTHORIZED', { message: 'Realm is not resolved' })
  return context.realm
}

export function requireUser(context: { user?: AuthenticatedUser }): AuthenticatedUser {
  if (!context.user) throw new ORPCError('UNAUTHORIZED', { message: 'Missing bearer token' })
  return context.user
}

const unauthorized = (message: string) => new ORPCError('UNAUTHORIZED', { message })

export const requireAuth = os.middleware(async ({ context, next }) => {
  if (context.authResolved && context.user) {
    return next({ context: { user: context.user, authResolved: true } })
  }

  const header = context.headers.get('authorization')
  if (!header?.startsWith(BEARER)) throw unauthorized('Missing bearer token')

  const realm = requireRealm(context)
  const claims = await context.tokens
    .verifyAccessToken(header.slice(BEARER.length), audienceFor(realm))
    .catch(() => {
      throw unauthorized('Access token is invalid or expired')
    })

  const session = await requireLiveSession(context.db, claims.sid, realm.settings.tokens).catch(
    (error) => {
      if (error instanceof SessionError)
        throw unauthorized(`Session is not usable: ${error.reason}`)
      throw error
    },
  )

  if (session.permissions_version !== claims.pv) {
    throw unauthorized('Permissions changed; refresh the access token')
  }

  if ((claims.act ?? null) !== session.impersonator_id) {
    throw unauthorized('Impersonation claim does not match the session')
  }

  const user: AuthenticatedUser = {
    id: claims.sub,
    realmId: realm.realmId,
    sessionId: session.id,
    aal: session.aal,
    activeOrgId: session.active_org_id,
    roles: claims.roles,
    permissionsVersion: session.permissions_version,
    impersonatorId: session.impersonator_id,
  }

  return next({ context: { user, authResolved: true } })
})

export function requireAal(minimum: 'aal2' | 'aal3') {
  return os.middleware(({ context, next, errors }) => {
    const user = context.user
    if (!user) throw new ORPCError('UNAUTHORIZED')

    const rank = { aal1: 1, aal2: 2, aal3: 3 } as const
    if (rank[user.aal] < rank[minimum]) {
      if ('STEP_UP_REQUIRED' in errors) {
        throw errors.STEP_UP_REQUIRED({ data: { requiredAal: minimum } })
      }
      throw new ORPCError('FORBIDDEN', { message: `Requires ${minimum}` })
    }

    return next()
  })
}

export function requirePermission(
  permission: string,
  toScope: (input: never) => Scope = () => ({ type: 'global', id: null }),
) {
  return os.middleware(async ({ context, next, errors }, input: never) => {
    const user = context.user
    if (!user) throw new ORPCError('UNAUTHORIZED')

    const allowed = await hasPermission(context.db, user.id, permission, toScope(input))
    if (!allowed) {
      if ('FORBIDDEN' in errors) throw errors.FORBIDDEN()
      throw new ORPCError('FORBIDDEN', { message: `Requires ${permission}` })
    }

    return next()
  })
}

export const pub = os.use(resolveRealm)

export const authed = pub.use(requireAuth)

function identifierOf(input: unknown): string | null {
  if (typeof input !== 'object' || input === null) return null

  const candidate = input as { email?: unknown; identifier?: unknown }
  if (typeof candidate.email === 'string') return candidate.email
  if (typeof candidate.identifier === 'string') return candidate.identifier

  return null
}

/**
 * Budgets one anonymous attempt against the caller's address and, where the
 * input names one, the account being targeted. `action` separates the budgets,
 * so exhausting password sign-in does not also close password reset.
 */
export function rateLimit(action: string) {
  return os.middleware(async ({ context, next, errors }, input: unknown) => {
    const realm = requireRealm(context)

    const verdict = await checkRateLimit(
      context.store,
      action,
      { ip: context.ip, identifier: identifierOf(input) },
      realm.settings.rateLimit,
    )

    if (!verdict.allowed) {
      if ('TOO_MANY_REQUESTS' in errors) {
        throw errors.TOO_MANY_REQUESTS({ data: { retryAfter: verdict.retryAfter } })
      }
      throw new ORPCError('TOO_MANY_REQUESTS', { data: { retryAfter: verdict.retryAfter } })
    }

    return next()
  })
}

/**
 * Blocks an operation that would widen what the impersonated session can do —
 * changing a credential, enrolling a factor, or impersonating again. An
 * administrator borrows an account to see what the user sees, never to take it.
 */
export const refuseWhileImpersonating = os.middleware(({ context, next }) => {
  if (requireUser(context).impersonatorId !== null) {
    throw new ORPCError('FORBIDDEN', {
      message: 'Not available while impersonating another account',
    })
  }

  return next()
})

export function requireHumanVerification(action: HumanVerificationAction) {
  return os.middleware(async ({ context, next }, input: { humanVerification?: string }) => {
    try {
      await context.humanVerification.verify(action, input.humanVerification, context.ip)
    } catch (error) {
      if (!(error instanceof HumanVerificationError)) throw error

      switch (error.reason) {
        case 'required':
          throw new ORPCError('HUMAN_VERIFICATION_REQUIRED')
        case 'failed':
          throw new ORPCError('HUMAN_VERIFICATION_FAILED')
        case 'unavailable':
          throw new ORPCError('HUMAN_VERIFICATION_UNAVAILABLE')
      }
    }

    return next()
  })
}
