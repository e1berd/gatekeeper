import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import type { User } from '@gatekeeper/contract'
import { toDate, toNullableDate } from './rows.ts'

type UserRow = {
  id: string
  realm_id: string
  email: string | null
  email_verified_at: string | null
  phone: string | null
  phone_verified_at: string | null
  password_hash: string | null
  status: User['status']
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  avatar_url: string | null
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
  mfa_enabled: boolean
}

function projectUser(row: UserRow): User {
  return {
    id: row.id,
    realmId: row.realm_id,
    email: row.email,
    emailVerified: row.email_verified_at !== null,
    phone: row.phone,
    phoneVerified: row.phone_verified_at !== null,
    avatarUrl: row.avatar_url,
    status: row.status,
    userWritableMetadata: row.user_metadata,
    serverOnlyMetadata: row.app_metadata,
    hasPassword: row.password_hash !== null,
    mfaEnabled: row.mfa_enabled,
    lastSignInAt: toNullableDate(row.last_sign_in_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }
}

/** Loads one user projected into the contract's {@link User} shape, or `null` when absent. */
export async function loadUser(db: Database, userId: string): Promise<User | null> {
  const rows = await db.execute<UserRow>(sql`
    select
      u.id, u.realm_id, u.email, u.email_verified_at, u.phone, u.phone_verified_at,
      u.password_hash, u.status, u.user_metadata, u.app_metadata, u.avatar_url,
      u.last_sign_in_at, u.created_at, u.updated_at,
      exists (
        select 1 from auth.mfa_factors f
        where f.user_id = u.id and f.status = 'verified'
      ) as mfa_enabled
    from auth.users u
    where u.id = ${userId}::uuid and u.deleted_at is null
    limit 1
  `)

  const row = rows[0]
  return row ? projectUser(row) : null
}
