import { authed, pub } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const sso = {
  discover: pub.sso.discover.handler(todo('sso.discover')),
  start: pub.sso.start.handler(todo('sso.start')),
  metadata: authed.sso.metadata.handler(todo('sso.metadata')),
  create: authed.sso.create.handler(todo('sso.create')),
  list: authed.sso.list.handler(todo('sso.list')),
  remove: authed.sso.remove.handler(todo('sso.remove')),
}
