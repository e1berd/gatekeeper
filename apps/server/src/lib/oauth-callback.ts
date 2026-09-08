import * as z from 'zod'
import { reject } from './flows.ts'
import { resolveUser } from './identities.ts'
import {
  callbackUrl,
  claimState,
  type FlowRow,
  issueAuthorizationCode,
  type OAuthDeps,
  type ResolvedProvider,
  resolveProvider,
  type SessionSink,
} from './oauth.ts'

const TOKEN_EXCHANGE_TIMEOUT_MS = 8_000

const TokenResponse = z.object({ access_token: z.string().min(1) })

async function redeemProviderCode(
  deps: OAuthDeps,
  { provider, credentials }: ResolvedProvider,
  code: string,
  verifier: string,
): Promise<string> {
  const response = await fetch(provider.tokenEndpoint, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: callbackUrl(deps, provider.slug),
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(TOKEN_EXCHANGE_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`${provider.slug} token endpoint answered ${response.status}`)

  return TokenResponse.parse(await response.json()).access_token
}

/**
 * The provider leg, reached by the browser rather than by a client. Returns
 * where to send the browser next, plus the authorization `code` and the
 * `sessionSink` the caller opened the flow with — `cookie` means the caller
 * redeems `code` itself and sets the session cookies before redirecting.
 */
export async function completeOAuthCallback(
  deps: OAuthDeps,
  slug: string,
  code: string,
  state: string,
): Promise<{ code: string; location: string; sessionSink: SessionSink }> {
  const resolved = resolveProvider(deps, slug)
  const row: FlowRow | undefined = await claimState(deps.db, state)

  if (!row || row.provider_type !== slug || !row.provider_verifier_encrypted) {
    reject({ code: 'INVALID_TOKEN' })
  }

  const verifier = await deps.secrets.open(row.provider_verifier_encrypted)
  const accessToken = await redeemProviderCode(deps, resolved, code, verifier)
  const profile = await resolved.provider.fetchProfile(accessToken)
  const userId = await resolveUser(deps.db, row.realm_id, slug, profile)
  const issued = await issueAuthorizationCode(deps, row, userId)

  return { ...issued, sessionSink: row.session_sink === 'cookie' ? 'cookie' : 'token' }
}
