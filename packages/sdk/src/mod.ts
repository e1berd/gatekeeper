import type { RouterContractClient } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AuthResult, contract } from '@gatekeeper/contract'
import {
  cookieStoreAdapter,
  localStorageAdapter,
  memoryStorage,
  type TokenStorage,
} from './storage.ts'

export type { TokenStorage }
export { cookieStoreAdapter, localStorageAdapter, memoryStorage }

/** Every procedure in the Gatekeeper contract. */
export type GatekeeperClient = RouterContractClient<typeof contract>

type PasskeysApi = Omit<GatekeeperClient['passkey'], 'authenticateVerify'> & {
  authenticateVerify: (
    input: Parameters<GatekeeperClient['passkey']['authenticateVerify']>[0],
  ) => Promise<AuthResult>
}

type MfaApi = Omit<GatekeeperClient['mfa'], 'stepUp' | 'verifyChallenge'> & {
  verifyChallenge: (
    input: Parameters<GatekeeperClient['mfa']['verifyChallenge']>[0],
  ) => Promise<AuthResult>
  stepUp: (
    input: Parameters<GatekeeperClient['mfa']['stepUp']>[0],
  ) => Promise<Awaited<ReturnType<GatekeeperClient['mfa']['stepUp']>>>
}

export interface GatekeeperOptions {
  /** Realm slug. Defaults to the automatically created `master` realm. */
  realm?: string

  /**
   * BCP 47 language tag sent as `Accept-Language`. The server localizes typed
   * error messages to it; `code` and `data` are unaffected.
   */
  language?: string

  /** Storage for the access and refresh tokens. */
  storage?: TokenStorage

  /** Seconds before expiry at which the access token is refreshed. @default 30 */
  refreshSkew?: number
}

export interface LegacyGatekeeperOptions extends GatekeeperOptions {
  /** Base URL of the Gatekeeper deployment. */
  url: string | URL

  /** Called when the session ends. Use the `signout` event on new clients. */
  onSignOut?: () => void
}

const ACCESS = 'access_token'
const ACCESS_EXP = 'access_token_exp'
const REFRESH = 'refresh_token'
const MASTER_REALM = 'master'

function defaultStorage(): TokenStorage {
  if (typeof globalThis.cookieStore !== 'undefined') return cookieStoreAdapter()
  if (typeof globalThis.localStorage !== 'undefined') return localStorageAdapter()
  return memoryStorage()
}

/** A browser or server-side client for one Gatekeeper deployment and realm. */
export class Gatekeeper extends EventTarget {
  readonly auth: {
    signUp: (input: Parameters<GatekeeperClient['auth']['signUp']>[0]) => Promise<AuthResult>
    signIn: (
      input: Parameters<GatekeeperClient['auth']['signInPassword']>[0],
    ) => Promise<AuthResult>
    requestOtp: GatekeeperClient['auth']['signInOtp']
    verifyOtp: (input: Parameters<GatekeeperClient['auth']['verifyOtp']>[0]) => Promise<AuthResult>
    verifySignedPayload: (
      input: Parameters<GatekeeperClient['auth']['verifySignedPayload']>[0],
    ) => Promise<AuthResult>
    verifyPasskey: (
      input: Parameters<GatekeeperClient['passkey']['authenticateVerify']>[0],
    ) => Promise<AuthResult>
    complete: (result: AuthResult) => Promise<AuthResult>
    getSession: GatekeeperClient['auth']['getSession']
    getMe: GatekeeperClient['profile']['get']
    verifyEmail: (
      input: Parameters<GatekeeperClient['auth']['verifyEmail']>[0],
    ) => Promise<AuthResult>
    requestPasswordReset: GatekeeperClient['auth']['requestPasswordReset']
    resetPassword: GatekeeperClient['auth']['resetPassword']
    changePassword: GatekeeperClient['auth']['changePassword']
    signOut: (scope?: 'local' | 'global') => Promise<void>
    switchOrg: (
      orgId: string | null,
    ) => Promise<Awaited<ReturnType<GatekeeperClient['auth']['switchOrg']>>>
    getAccessToken: () => Promise<string | null>
    isAuthenticated: () => Promise<boolean>
    oauth: {
      start: GatekeeperClient['auth']['oauthStart']
      exchange: (
        input: Parameters<GatekeeperClient['auth']['oauthExchange']>[0],
      ) => Promise<AuthResult>
    }
    sessions: {
      list: GatekeeperClient['auth']['listSessions']
      revoke: GatekeeperClient['auth']['revokeSession']
    }
    profile: GatekeeperClient['profile']
    passkeys: PasskeysApi
    mfa: MfaApi
  }
  readonly sso: {
    discover: GatekeeperClient['sso']['discover']
    start: GatekeeperClient['sso']['start']
    providers: {
      create: GatekeeperClient['sso']['create']
      list: GatekeeperClient['sso']['list']
      remove: GatekeeperClient['sso']['remove']
      metadata: GatekeeperClient['sso']['metadata']
    }
  }
  readonly health: GatekeeperClient['health']
  readonly humanVerification: GatekeeperClient['humanVerification']
  readonly org: GatekeeperClient['org']
  readonly authz: GatekeeperClient['authz']
  readonly hooks: GatekeeperClient['hooks']
  readonly admin: GatekeeperClient['admin']

  #client: GatekeeperClient
  #storage: TokenStorage
  #skew: number
  #refreshing: Promise<string | null> | null = null
  #refreshClient: GatekeeperClient

  constructor(url: string | URL, options: GatekeeperOptions = {}) {
    super()
    this.#storage = options.storage ?? defaultStorage()
    this.#skew = options.refreshSkew ?? 30

    const origin = url.toString().replace(/\/+$/, '')
    const staticHeaders = () => {
      const headers: Record<string, string> = {
        'x-gatekeeper-realm': options.realm ?? MASTER_REALM,
      }
      if (options.language) headers['accept-language'] = options.language
      return headers
    }
    const link = new RPCLink({
      origin,
      url: '/rpc',
      headers: async () => {
        const headers = staticHeaders()
        const token = await this.#currentAccessToken()
        if (token) headers.authorization = `Bearer ${token}`
        return headers
      },
    })

    this.#client = createORPCClient(link)
    this.#refreshClient = createORPCClient(
      new RPCLink({ origin, url: '/rpc', headers: staticHeaders }),
    )
    this.auth = {
      signUp: async (input) =>
        await this.#persistAuthentication(await this.#client.auth.signUp(input)),
      signIn: async (input) =>
        await this.#persistAuthentication(await this.#client.auth.signInPassword(input)),
      requestOtp: this.#client.auth.signInOtp,
      verifyOtp: async (input) =>
        await this.#persistAuthentication(await this.#client.auth.verifyOtp(input)),
      verifySignedPayload: async (input) =>
        await this.#persistAuthentication(await this.#client.auth.verifySignedPayload(input)),
      verifyPasskey: async (input) =>
        await this.#persistAuthentication(await this.#client.passkey.authenticateVerify(input)),
      complete: async (result) => await this.#persistAuthentication(result),
      getSession: this.#client.auth.getSession,
      getMe: this.#client.profile.get,
      verifyEmail: async (input) =>
        await this.#persistAuthentication(await this.#client.auth.verifyEmail(input)),
      requestPasswordReset: this.#client.auth.requestPasswordReset,
      resetPassword: this.#client.auth.resetPassword,
      changePassword: this.#client.auth.changePassword,
      signOut: async (scope = 'local') => await this.#signOut(scope),
      switchOrg: async (orgId) => {
        const result = await this.#client.auth.switchOrg({ orgId })
        await this.#persist(result)
        return result
      },
      getAccessToken: async () => await this.#currentAccessToken(),
      isAuthenticated: async () => (await this.#currentAccessToken()) !== null,
      oauth: {
        start: this.#client.auth.oauthStart,
        exchange: async (input) =>
          await this.#persistAuthentication(await this.#client.auth.oauthExchange(input)),
      },
      sessions: {
        list: this.#client.auth.listSessions,
        revoke: this.#client.auth.revokeSession,
      },
      profile: this.#client.profile,
      passkeys: {
        registerOptions: this.#client.passkey.registerOptions,
        registerVerify: this.#client.passkey.registerVerify,
        authenticateOptions: this.#client.passkey.authenticateOptions,
        authenticateVerify: async (input) =>
          await this.#persistAuthentication(await this.#client.passkey.authenticateVerify(input)),
        list: this.#client.passkey.list,
        rename: this.#client.passkey.rename,
        remove: this.#client.passkey.remove,
      },
      mfa: {
        enrollTotp: this.#client.mfa.enrollTotp,
        verifyTotpEnrolment: this.#client.mfa.verifyTotpEnrolment,
        verifyChallenge: async (input) =>
          await this.#persistAuthentication(await this.#client.mfa.verifyChallenge(input)),
        stepUp: async (input) => {
          const result = await this.#client.mfa.stepUp(input)
          await this.#persist(result)
          return result
        },
        listFactors: this.#client.mfa.listFactors,
        removeFactor: this.#client.mfa.removeFactor,
        regenerateRecoveryCodes: this.#client.mfa.regenerateRecoveryCodes,
      },
    }
    this.sso = {
      discover: this.#client.sso.discover,
      start: this.#client.sso.start,
      providers: {
        create: this.#client.sso.create,
        list: this.#client.sso.list,
        remove: this.#client.sso.remove,
        metadata: this.#client.sso.metadata,
      },
    }
    this.health = this.#client.health
    this.humanVerification = this.#client.humanVerification
    this.org = this.#client.org
    this.authz = this.#client.authz
    this.hooks = this.#client.hooks
    this.admin = this.#client.admin
  }

  async #currentAccessToken(): Promise<string | null> {
    const token = await this.#storage.get(ACCESS)
    const expRaw = await this.#storage.get(ACCESS_EXP)
    const exp = expRaw ? Number(expRaw) : 0

    if (token && exp - this.#skew > Date.now() / 1000) return token
    if (!(await this.#storage.get(REFRESH))) return null

    this.#refreshing ??= this.#refresh().finally(() => {
      this.#refreshing = null
    })
    return await this.#refreshing
  }

  async #persist(tokens: { accessToken: string; expiresIn: number; refreshToken?: string }) {
    await this.#storage.set(ACCESS, tokens.accessToken)
    await this.#storage.set(ACCESS_EXP, String(Math.floor(Date.now() / 1000) + tokens.expiresIn))
    if (tokens.refreshToken) await this.#storage.set(REFRESH, tokens.refreshToken)
  }

  async #persistAuthentication(result: AuthResult): Promise<AuthResult> {
    if (result.status === 'authenticated') await this.#persist(result.tokens)
    return result
  }

  async #clear() {
    await this.#storage.remove(ACCESS)
    await this.#storage.remove(ACCESS_EXP)
    await this.#storage.remove(REFRESH)
  }

  async #refresh(): Promise<string | null> {
    const refreshToken = await this.#storage.get(REFRESH)
    if (!refreshToken) return null

    try {
      const tokens = await this.#refreshClient.auth.refresh({ refreshToken })
      await this.#persist(tokens)
      return tokens.accessToken
    } catch {
      await this.#clear()
      this.dispatchEvent(new Event('signout'))
      return null
    }
  }

  async #signOut(scope: 'local' | 'global') {
    try {
      await this.#client.auth.signOut({ scope })
    } finally {
      await this.#clear()
      this.dispatchEvent(new Event('signout'))
    }
  }
}

/** Creates a {@link Gatekeeper} using the pre-0.2 options-object API. */
export function createGatekeeper(options: LegacyGatekeeperOptions): Gatekeeper {
  const client = new Gatekeeper(options.url, options)
  if (options.onSignOut) client.addEventListener('signout', options.onSignOut)
  return client
}
