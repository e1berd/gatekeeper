import { authed } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const authz = {
  check: authed.authz.check.handler(todo('authz.check')),
  checkBulk: authed.authz.checkBulk.handler(todo('authz.checkBulk')),
  effectivePermissions: authed.authz.effectivePermissions.handler(
    todo('authz.effectivePermissions'),
  ),
  listSubjectsWithPermission: authed.authz.listSubjectsWithPermission.handler(
    todo('authz.listSubjectsWithPermission'),
  ),
}
