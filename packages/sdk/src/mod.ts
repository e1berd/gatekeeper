import type { RouterContractClient } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AuthResult, contract } from '@gatekeeper/contract'
import { localStorageAdapter, memoryStorage, type TokenStorage } from './storage.ts'

export type { TokenStorage }
export { localStorageAdapter, memoryStorage }

/** Every procedure in the contract, available through {@link Gatekeeper.raw}. */
export type GatekeeperClient = RouterContractClient<typeof contract>

export interface GatekeeperOptions {
  /** Realm slug. Defaults to the automatically created `master` realm. */
  realm?: string

  /** Storage for the access and refresh tokens. */
  storage?: TokenStorage

  /** Seconds before expiry at which the access token is refreshed. @default 30 */
  refreshSkew?: number
}

export interface LegacyGatekeeperOptions extends GatekeeperOptions {
  /** Base URL of the Gatekeeper deployment. */
  url: string

  /** Called when the session ends. Use the `signout` event on new clients. */
  onSignOut?: () => void
}

const ACCESS = 'access_token'
const ACCESS_EXP = 'access_token_exp'
const REFRESH = 'refresh_token'
const MASTER_REALM = 'master'

/**
 * A browser or server-side client for one Gatekeeper deployment and realm.
 *
 * It persists tokens, attaches a bearer token to RPC calls, and coordinates refreshes. Auth flow
 * methods are under {@link auth}; every unwrapped contract procedure remains under {@link raw}.
 */
export class Gatekeeper extends EventTarget {
  readonly raw: GatekeeperClient
  readonly auth: {
    signUp: (input: Parameters<GatekeeperClient['auth']['signUp']>[0]) => Promise<AuthResult>
    signIn: (input: { email: string; password: string }) => Promise<AuthResult>
    verifyOtp: (input: Parameters<GatekeeperClient['auth']['verifyOtp']>[0]) => Promise<AuthResult>
    verifyPasskey: (
      input: Parameters<GatekeeperClient['passkey']['authenticateVerify']>[0],
    ) => Promise<AuthResult>
    complete: (result: AuthResult) => Promise<AuthResult>
    getSession: GatekeeperClient['auth']['getSession']
    getMe: GatekeeperClient['profile']['get']
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

  #storage: TokenStorage
  #skew: number
  #refreshing: Promise<string | null> | null = null
  #refreshClient: GatekeeperClient

  constructor(url: string, options: GatekeeperOptions = {}) {
    super()
    this.#storage =
      options.storage ??
      (typeof globalThis.localStorage !== 'undefined' ? localStorageAdapter() : memoryStorage())
    this.#skew = options.refreshSkew ?? 30

    const origin = url.replace(/\/+$/, '')
    const realmHeaders = () => ({ 'x-gatekeeper-realm': options.realm ?? MASTER_REALM })
    const link = new RPCLink({
      origin,
      url: '/rpc',
      headers: async () => {
        const headers: Record<string, string> = realmHeaders()
        const token = await this.#currentAccessToken()
        if (token) headers.authorization = `Bearer ${token}`
        return headers
      },
    })

    this.raw = createORPCClient(link)
    this.#refreshClient = createORPCClient(
      new RPCLink({ origin, url: '/rpc', headers: realmHeaders }),
    )
    this.auth = {
      signUp: async (input) => await this.#persistAuthentication(await this.raw.auth.signUp(input)),
      signIn: async (input) =>
        await this.#persistAuthentication(await this.raw.auth.signInPassword(input)),
      verifyOtp: async (input) =>
        await this.#persistAuthentication(await this.raw.auth.verifyOtp(input)),
      verifyPasskey: async (input) =>
        await this.#persistAuthentication(await this.raw.passkey.authenticateVerify(input)),
      complete: async (result) => await this.#persistAuthentication(result),
      getSession: this.raw.auth.getSession,
      getMe: this.raw.profile.get,
      signOut: async (scope = 'local') => await this.#signOut(scope),
      switchOrg: async (orgId) => {
        const result = await this.raw.auth.switchOrg({ orgId })
        await this.#persist(result)
        return result
      },
      getAccessToken: async () => await this.#currentAccessToken(),
      isAuthenticated: async () => (await this.#currentAccessToken()) !== null,
      oauth: {
        start: this.raw.auth.oauthStart,
        exchange: async (input) =>
          await this.#persistAuthentication(await this.raw.auth.oauthExchange(input)),
      },
    }
    this.sso = {
      discover: this.raw.sso.discover,
      start: this.raw.sso.start,
      providers: {
        create: this.raw.sso.create,
        list: this.raw.sso.list,
        remove: this.raw.sso.remove,
        metadata: this.raw.sso.metadata,
      },
    }
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
      await this.raw.auth.signOut({ scope })
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
