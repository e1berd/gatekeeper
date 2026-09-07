import { sql } from 'drizzle-orm'
import * as z from 'zod'
import type { Database } from '@gatekeeper/db'
import { findCredentials, reject } from './flows.ts'
import {
  callbackUrl,
  claimState,
  type FlowRow,
  issueAuthorizationCode,
  type OAuthDeps,
  type ResolvedProvider,
  resolveProvider,
} from './oauth.ts'
import type { OAuthProfile } from './oauth-providers.ts'

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

async function recordSignIn(db: Database, identityId: string): Promise<void> {
  await db.execute(sql`
    update auth.identities set last_sign_in_at = now() where id = ${identityId}::uuid
  `)
}

async function linkIdentity(
  db: Database,
  realmId: string,
  userId: string,
  slug: string,
  profile: OAuthProfile,
): Promise<void> {
  await db.execute(sql`
    insert into auth.identities
      (user_id, realm_id, provider, provider_user_id, identity_data, email, last_sign_in_at)
    values (
      ${userId}::uuid, ${realmId}::uuid, ${slug}, ${profile.providerUserId},
      ${JSON.stringify(profile)}::jsonb, ${profile.email}, now()
    )
    on conflict do nothing
  `)
}

async function createUser(db: Database, realmId: string, profile: OAuthProfile): Promise<string> {
  const rows = await db.execute<{ id: string }>(sql`
    insert into auth.users (realm_id, email, email_verified_at, avatar_url, status)
    values (
      ${realmId}::uuid, ${profile.email}, ${profile.emailVerified ? sql`now()` : null},
      ${profile.avatarUrl}, 'active'
    )
    returning id
  `)

  const id = rows[0]?.id
  if (!id) throw new Error('Failed to provision a user from the provider profile')

  return id
}

/**
 * Finds or creates the account behind a provider profile.
 *
 * A second provider for an address that already has an account adds an identity
 * rather than a second user — but only when the provider says it verified that
 * address. An unverified address is a claim, not a proof, and honouring it would
 * let anyone who can set a profile email take over the matching account.
 */
async function resolveUser(
  deps: OAuthDeps,
  realmId: string,
  slug: string,
  profile: OAuthProfile,
): Promise<string> {
  const linked = await deps.db.execute<{ id: string; user_id: string }>(sql`
    select id, user_id from auth.identities
    where realm_id = ${realmId}::uuid and provider = ${slug}
      and provider_user_id = ${profile.providerUserId}
    limit 1
  `)

  const identity = linked[0]
  if (identity) {
    await recordSignIn(deps.db, identity.id)
    return identity.user_id
  }

  if (profile.email) {
    const existing = await findCredentials(deps.db, realmId, profile.email)

    if (existing) {
      if (!profile.emailVerified) reject({ code: 'EMAIL_TAKEN' })

      await linkIdentity(deps.db, realmId, existing.id, slug, profile)
      return existing.id
    }
  }

  const userId = await createUser(deps.db, realmId, profile)
  await linkIdentity(deps.db, realmId, userId, slug, profile)

  return userId
}

/**
 * The provider leg, reached by the browser rather than by a client. Returns the
 * URL to send it on to, already carrying Gatekeeper's own authorization code.
 */
export async function completeOAuthCallback(
  deps: OAuthDeps,
  slug: string,
  code: string,
  state: string,
): Promise<string> {
  const resolved = resolveProvider(deps, slug)
  const row: FlowRow | undefined = await claimState(deps.db, state)

  if (!row || row.provider_type !== slug || !row.provider_verifier_encrypted) {
    reject({ code: 'INVALID_TOKEN' })
  }

  const verifier = await deps.secrets.open(row.provider_verifier_encrypted)
  const accessToken = await redeemProviderCode(deps, resolved, code, verifier)
  const profile = await resolved.provider.fetchProfile(accessToken)
  const userId = await resolveUser(deps, row.realm_id, slug, profile)

  return await issueAuthorizationCode(deps, row, userId)
}
