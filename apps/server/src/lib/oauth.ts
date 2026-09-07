import { sql } from 'drizzle-orm'
import type { AuthResult } from '@gatekeeper/contract'
import type { Database } from '@gatekeeper/db'
import { type FlowEnv, mfaChallenge, reject } from './flows.ts'
import { findProvider, type OAuthProvider } from './oauth-providers.ts'
import { openSession } from './password-auth.ts'
import { toAllowedRedirect } from './redirects.ts'
import type { SecretStore } from './secrets.ts'
import { createOpaqueToken, sha256Base64Url, sha256Hex, timingSafeEquals } from './tokens.ts'

export const OAUTH_FLOW_TTL_SECONDS = 600
export const AUTHORIZATION_CODE_TTL_SECONDS = 300

export interface OAuthCredentials {
  clientId: string
  clientSecret: string
  scopes: string[]
}

export interface OAuthDeps {
  db: Database
  secrets: SecretStore
  providers: Record<string, OAuthCredentials>
  issuer: string
  allowedRedirectOrigins: readonly string[]
}

export interface OAuthEnv extends OAuthDeps {
  flow: FlowEnv
}

export interface ResolvedProvider {
  provider: OAuthProvider
  credentials: OAuthCredentials
}

/** The provider must both be known to Gatekeeper and configured on this deployment. */
export function resolveProvider(deps: OAuthDeps, slug: string): ResolvedProvider {
  const provider = findProvider(slug)
  const credentials = deps.providers[slug]

  if (!provider || !credentials) reject({ code: 'PROVIDER_NOT_CONFIGURED', provider: slug })

  return { provider, credentials }
}

export const callbackUrl = (deps: OAuthDeps, slug: string) =>
  new URL(`/oauth/${slug}/callback`, deps.issuer).toString()

export type FlowRow = {
  id: string
  realm_id: string
  user_id: string | null
  code_challenge: string | null
  provider_type: string
  provider_verifier_encrypted: string | null
  redirect_to: string | null
}

const FLOW_COLUMNS = sql`
  id, realm_id, user_id, code_challenge, provider_type,
  provider_verifier_encrypted, redirect_to
`

/**
 * Spends the `state` handed to the provider. The update is the check, so a
 * replayed callback finds nothing to claim.
 */
export async function claimState(db: Database, state: string): Promise<FlowRow | undefined> {
  const rows = await db.execute<FlowRow>(sql`
    update auth.flow_state set state_hash = null
    where state_hash = ${await sha256Hex(state)} and expires_at > now()
    returning ${FLOW_COLUMNS}
  `)

  return rows[0]
}

async function claimAuthorizationCode(db: Database, code: string): Promise<FlowRow | undefined> {
  const rows = await db.execute<FlowRow>(sql`
    delete from auth.flow_state
    where auth_code_hash = ${await sha256Hex(code)} and expires_at > now()
    returning ${FLOW_COLUMNS}
  `)

  return rows[0]
}

export interface OAuthStartInput {
  provider: string
  redirectTo?: string | undefined
  codeChallenge?: string | undefined
}

/**
 * Opens a social sign-in. Two independent PKCE exchanges meet here: the one the
 * caller runs against Gatekeeper (`codeChallenge`, redeemed in
 * {@link exchangeAuthorizationCode}) and the one Gatekeeper runs against the
 * provider, whose verifier is sealed until the callback needs it.
 */
export async function beginOAuth(
  env: OAuthEnv,
  input: OAuthStartInput,
): Promise<{ authorizationUrl: string; state: string }> {
  const { provider, credentials } = resolveProvider(env, input.provider)
  const realmId = env.flow.session.realmId

  const state = await createOpaqueToken()
  const verifier = await createOpaqueToken()
  const sealed = await env.secrets.seal(realmId, verifier.token)
  const expiresAt = new Date(Date.now() + OAUTH_FLOW_TTL_SECONDS * 1000)

  await env.db.execute(sql`
    insert into auth.flow_state
      (realm_id, state_hash, code_challenge, code_challenge_method, provider_type,
       provider_verifier_encrypted, redirect_to, expires_at)
    values (
      ${realmId}::uuid, ${state.hash}, ${input.codeChallenge ?? null},
      ${input.codeChallenge ? 'S256' : null}, ${provider.slug}, ${sealed},
      ${input.redirectTo ?? null}, ${expiresAt.toISOString()}::timestamptz
    )
  `)

  const scopes = credentials.scopes.length > 0 ? credentials.scopes : provider.defaultScopes
  const url = new URL(provider.authorizationEndpoint)

  url.searchParams.set('client_id', credentials.clientId)
  url.searchParams.set('redirect_uri', callbackUrl(env, provider.slug))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scopes.join(' '))
  url.searchParams.set('state', state.token)
  url.searchParams.set('code_challenge', await sha256Base64Url(verifier.token))
  url.searchParams.set('code_challenge_method', 'S256')

  return { authorizationUrl: url.toString(), state: state.token }
}

/** Where the browser is sent once the provider leg finishes, carrying our own code. */
export async function issueAuthorizationCode(
  deps: OAuthDeps,
  row: FlowRow,
  userId: string,
): Promise<string> {
  const code = await createOpaqueToken()
  const expiresAt = new Date(Date.now() + AUTHORIZATION_CODE_TTL_SECONDS * 1000)

  await deps.db.execute(sql`
    update auth.flow_state
    set auth_code_hash = ${code.hash}, user_id = ${userId}::uuid,
        provider_verifier_encrypted = null,
        expires_at = ${expiresAt.toISOString()}::timestamptz
    where id = ${row.id}::uuid
  `)

  const target = new URL(
    toAllowedRedirect(row.redirect_to, deps.allowedRedirectOrigins, deps.issuer),
  )
  target.searchParams.set('code', code.token)

  return target.toString()
}

/**
 * Redeems the code handed back by {@link issueAuthorizationCode}. A flow opened
 * with a `codeChallenge` only completes for the caller holding its verifier, so
 * a code intercepted in the redirect is worthless on its own.
 */
export async function exchangeAuthorizationCode(
  env: OAuthEnv,
  input: { code: string; codeVerifier?: string | undefined },
): Promise<AuthResult> {
  const row = await claimAuthorizationCode(env.db, input.code)

  if (!row?.user_id || row.realm_id !== env.flow.session.realmId) {
    return reject({ code: 'INVALID_TOKEN' })
  }

  if (row.code_challenge !== null) {
    const presented = input.codeVerifier ? await sha256Base64Url(input.codeVerifier) : ''
    if (!timingSafeEquals(presented, row.code_challenge)) return reject({ code: 'INVALID_TOKEN' })
  }

  return (
    (await mfaChallenge(env.db, row.user_id)) ?? {
      status: 'authenticated',
      tokens: await openSession(env.flow, row.user_id, ['oauth']),
    }
  )
}
