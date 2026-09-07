import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import { findCredentials, reject } from './flows.ts'
import type { OAuthProfile } from './oauth-providers.ts'

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
export async function resolveUser(
  db: Database,
  realmId: string,
  slug: string,
  profile: OAuthProfile,
): Promise<string> {
  const linked = await db.execute<{ id: string; user_id: string }>(sql`
    select id, user_id from auth.identities
    where realm_id = ${realmId}::uuid and provider = ${slug}
      and provider_user_id = ${profile.providerUserId}
    limit 1
  `)

  const identity = linked[0]
  if (identity) {
    await recordSignIn(db, identity.id)
    return identity.user_id
  }

  if (profile.email) {
    const existing = await findCredentials(db, realmId, profile.email)

    if (existing) {
      if (!profile.emailVerified) reject({ code: 'EMAIL_TAKEN' })

      await linkIdentity(db, realmId, existing.id, slug, profile)
      return existing.id
    }
  }

  const userId = await createUser(db, realmId, profile)
  await linkIdentity(db, realmId, userId, slug, profile)

  return userId
}
