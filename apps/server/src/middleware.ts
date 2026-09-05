import { implement, ORPCError } from '@orpc/server'
import { contract } from '@gatekeeper/contract'
import type { HumanVerificationAction, Scope } from '@gatekeeper/contract'
import type { AuthenticatedUser, InitialContext, RealmContext } from './context.ts'
import { resolveRealmBySlug } from './lib/realm.ts'
import { hasPermission } from './lib/authz.ts'
import { HumanVerificationError } from './lib/human-verification.ts'

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

export const requireAuth = os.middleware(({ context, next }) => {
  if (context.authResolved && context.user) {
    return next({ context: { user: context.user, authResolved: true } })
  }

  const header = context.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Missing bearer token' })
  }

  throw new ORPCError('NOT_IMPLEMENTED', { message: 'Token verification is not implemented yet' })
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
