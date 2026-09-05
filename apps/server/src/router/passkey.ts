import { authed, pub } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const passkey = {
  registerOptions: authed.passkey.registerOptions.handler(todo('passkey.registerOptions')),
  registerVerify: authed.passkey.registerVerify.handler(todo('passkey.registerVerify')),
  authenticateOptions: pub.passkey.authenticateOptions.handler(todo('passkey.authenticateOptions')),
  authenticateVerify: pub.passkey.authenticateVerify.handler(todo('passkey.authenticateVerify')),
  list: authed.passkey.list.handler(todo('passkey.list')),
  rename: authed.passkey.rename.handler(todo('passkey.rename')),
  remove: authed.passkey.remove.handler(todo('passkey.remove')),
}
