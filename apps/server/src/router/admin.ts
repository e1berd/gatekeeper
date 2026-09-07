import { authed, refuseWhileImpersonating } from '../middleware.ts'

const takeover = authed.use(refuseWhileImpersonating)
import { todo } from '../lib/todo.ts'

export const admin = {
  users: {
    list: authed.admin.users.list.handler(todo('admin.users.list')),
    get: authed.admin.users.get.handler(todo('admin.users.get')),
    create: authed.admin.users.create.handler(todo('admin.users.create')),
    update: authed.admin.users.update.handler(todo('admin.users.update')),
    remove: authed.admin.users.remove.handler(todo('admin.users.remove')),
    ban: authed.admin.users.ban.handler(todo('admin.users.ban')),
    setPassword: takeover.admin.users.setPassword.handler(todo('admin.users.setPassword')),
    listSessions: authed.admin.users.listSessions.handler(todo('admin.users.listSessions')),
    revokeSessions: authed.admin.users.revokeSessions.handler(todo('admin.users.revokeSessions')),
    impersonate: takeover.admin.users.impersonate.handler(todo('admin.users.impersonate')),
  },
  roles: {
    list: authed.admin.roles.list.handler(todo('admin.roles.list')),
    get: authed.admin.roles.get.handler(todo('admin.roles.get')),
    create: authed.admin.roles.create.handler(todo('admin.roles.create')),
    update: authed.admin.roles.update.handler(todo('admin.roles.update')),
    remove: authed.admin.roles.remove.handler(todo('admin.roles.remove')),
  },
  permissions: {
    list: authed.admin.permissions.list.handler(todo('admin.permissions.list')),
    create: authed.admin.permissions.create.handler(todo('admin.permissions.create')),
    remove: authed.admin.permissions.remove.handler(todo('admin.permissions.remove')),
  },
  grants: {
    grant: authed.admin.grants.grant.handler(todo('admin.grants.grant')),
    revoke: authed.admin.grants.revoke.handler(todo('admin.grants.revoke')),
    listForUser: authed.admin.grants.listForUser.handler(todo('admin.grants.listForUser')),
  },
  realms: {
    list: authed.admin.realms.list.handler(todo('admin.realms.list')),
    create: authed.admin.realms.create.handler(todo('admin.realms.create')),
    update: authed.admin.realms.update.handler(todo('admin.realms.update')),
  },
  audit: {
    list: authed.admin.audit.list.handler(todo('admin.audit.list')),
  },
}
