import type { RouterContractClient } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { contract } from '@gatekeeper/contract'
import { localStorageAdapter, memoryStorage, type TokenStorage } from './storage.ts'

export type { TokenStorage }
export { localStorageAdapter, memoryStorage }

/** Every procedure in the contract, typed, callable as `client.auth.refresh(...)`. */
export type GatekeeperClient = RouterContractClient<typeof contract>

export interface GatekeeperOptions {
  /** Base URL of the deployment, e.g. `https://auth.example.com`. A trailing slash is trimmed. */
  url: string

  /**
   * Realm slug. Sent as a header rather than in the body, so it cannot be
   * forged by editing a payload. The server falls back to `default`.
   */
  realm?: string

  /**
   * Where tokens are kept. Defaults to `localStorage` in browsers and to memory
   * elsewhere. On a server, pass a fresh {@link memoryStorage} per request so
   * one user's session cannot leak into another's.
   */
  storage?: TokenStorage

  /**
   * Seconds before expiry at which the access token is refreshed proactively,
   * so a request is not lost to a token that expires in flight.
   *
   * @default 30
   */
  refreshSkew?: number

  /**
   * Called when the session ends and cannot be recovered: the refresh token
   * expired, was revoked, or was detected as replayed. Redirect to your login
   * page from here.
   */
  onSignOut?: () => void
}

const ACCESS = 'access_token'
const ACCESS_EXP = 'access_token_exp'
const REFRESH = 'refresh_token'

/**
 * Creates a typed Gatekeeper client.
 *
 * Every procedure is reachable directly — `gk.auth.signInPassword(...)`,
 * `gk.org.invite(...)` — with request and response types taken from the
 * contract package. There is no code generation, and no server code reaches
 * your bundle.
 *
 * On top of the raw RPC client it handles what every consumer would otherwise
 * rewrite: storing tokens, attaching the `Authorization` header, and refreshing
 * an expired access token. Concurrent calls during an expiry share one refresh
 * rather than each issuing their own.
 *
 * @example
 * ```ts
 * const gk = createGatekeeper({
 *   url: 'https://auth.example.com',
 *   realm: 'production',
 *   onSignOut: () => location.assign('/login'),
 * })
 *
 * const result = await gk.signIn({ email, password })
 * if (result.status === 'mfa_required') {
 *   await gk.mfa.verifyChallenge({
 *     challengeToken: result.challengeToken,
 *     factorId: result.factors[0].id,
 *     code,
 *   })
 * }
 * ```
 */
export function createGatekeeper(options: GatekeeperOptions) {
  const storage =
    options.storage ??
    (typeof globalThis.localStorage !== 'undefined' ? localStorageAdapter() : memoryStorage())
  const skew = options.refreshSkew ?? 30

  let refreshing: Promise<string | null> | null = null

  async function currentAccessToken(): Promise<string | null> {
    const token = await storage.get(ACCESS)
    const expRaw = await storage.get(ACCESS_EXP)
    const exp = expRaw ? Number(expRaw) : 0

    if (token && exp - skew > Date.now() / 1000) return token
    if (!(await storage.get(REFRESH))) return null

    refreshing ??= doRefresh().finally(() => {
      refreshing = null
    })
    return refreshing
  }

  async function persist(tokens: {
    accessToken: string
    expiresIn: number
    refreshToken?: string
  }) {
    await storage.set(ACCESS, tokens.accessToken)
    await storage.set(ACCESS_EXP, String(Math.floor(Date.now() / 1000) + tokens.expiresIn))
    if (tokens.refreshToken) await storage.set(REFRESH, tokens.refreshToken)
  }

  async function clear() {
    await storage.remove(ACCESS)
    await storage.remove(ACCESS_EXP)
    await storage.remove(REFRESH)
  }

  async function doRefresh(): Promise<string | null> {
    const refreshToken = await storage.get(REFRESH)
    if (!refreshToken) return null

    try {
      const tokens = await raw.auth.refresh({ refreshToken })
      await persist(tokens)
      return tokens.accessToken
    } catch {
      await clear()
      options.onSignOut?.()
      return null
    }
  }

  const link = new RPCLink({
    origin: options.url.replace(/\/+$/, ''),
    url: '/rpc',
    headers: async () => {
      const headers: Record<string, string> = {}
      if (options.realm) headers['x-gatekeeper-realm'] = options.realm
      const token = await currentAccessToken()
      if (token) headers.authorization = `Bearer ${token}`
      return headers
    },
  })

  const raw: GatekeeperClient = createORPCClient(link)

  return {
    ...raw,

    /**
     * The untouched RPC client, without token persistence.
     *
     * An escape hatch for calls that must bypass the automatic refresh, or
     * where you want to handle storage yourself.
     */
    raw,

    /**
     * Signs in with a password, storing the tokens on success.
     *
     * Returns the full result, so check `status` before assuming a session
     * exists — the realm may demand MFA or a verified email first.
     */
    async signIn(input: { email: string; password: string }) {
      const result = await raw.auth.signInPassword(input)
      if (result.status === 'authenticated') await persist(result.tokens)
      return result
    },

    /**
     * Revokes the session and clears stored tokens.
     *
     * Local storage is cleared even when the server call fails, so a user can
     * always sign out of a device. Pass `global` to end every session the user
     * has anywhere.
     */
    async signOut(scope: 'local' | 'global' = 'local') {
      try {
        await raw.auth.signOut({ scope })
      } finally {
        await clear()
        options.onSignOut?.()
      }
    },

    /**
     * Rebinds the access token to another organization.
     *
     * A token carries the roles of one active organization rather than a map of
     * every membership, so switching re-mints it. The session and refresh token
     * are untouched; this is not a re-login.
     *
     * @param orgId Organization to activate, or `null` for the global context —
     *   the correct state for a user who belongs to none.
     */
    async switchOrg(orgId: string | null) {
      const result = await raw.auth.switchOrg({ orgId })
      await persist(result)
      return result
    },

    /**
     * Returns a valid access token, refreshing first when needed.
     *
     * Resolves to `null` instead of throwing when no usable session exists.
     * Use it to authorize requests to your own API.
     */
    async getAccessToken() {
      return await currentAccessToken()
    },

    /** Whether a usable session exists, refreshing once if the token has expired. */
    async isAuthenticated() {
      return (await currentAccessToken()) !== null
    },
  }
}
