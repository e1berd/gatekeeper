import { authed } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const hooks = {
  list: authed.hooks.list.handler(todo('hooks.list')),
  create: authed.hooks.create.handler(todo('hooks.create')),
  update: authed.hooks.update.handler(todo('hooks.update')),
  remove: authed.hooks.remove.handler(todo('hooks.remove')),
  listDeliveries: authed.hooks.listDeliveries.handler(todo('hooks.listDeliveries')),
  retryDelivery: authed.hooks.retryDelivery.handler(todo('hooks.retryDelivery')),
}
