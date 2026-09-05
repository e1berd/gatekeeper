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
