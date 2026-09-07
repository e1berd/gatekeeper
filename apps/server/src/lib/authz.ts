import { sql } from 'drizzle-orm'
import type { Database } from '@gatekeeper/db'
import type { Scope } from '@gatekeeper/contract'

export async function hasPermission(
  db: Database,
  userId: string,
  permission: string,
  scope: Scope,
): Promise<boolean> {
  const rows = await db.execute<{ allowed: boolean }>(sql`
    select rbac.has_permission(
      ${userId}::uuid, ${permission}, ${scope.type}, ${scope.id}
    ) as allowed
  `)

  return rows[0]?.allowed === true
}

export async function effectivePermissions(
  db: Database,
  userId: string,
  scope: Scope,
): Promise<string[]> {
  const rows = await db.execute<{ permission: string }>(sql`
    select permission from rbac.effective_permissions(
      ${userId}::uuid, ${scope.type}, ${scope.id}
    )
  `)

  return rows.map((r) => r.permission)
}

/** Role keys the user effectively holds in `scope`, including inherited ones. */
export async function effectiveRoleKeys(
  db: Database,
  userId: string,
  scope: Scope,
): Promise<string[]> {
  const rows = await db.execute<{ key: string }>(sql`
    select distinct r.key
    from rbac.effective_role_ids(${userId}::uuid, ${scope.type}, ${scope.id}) e
    join rbac.roles r on r.id = e.role_id
    order by r.key
  `)

  return rows.map((row) => row.key)
}
