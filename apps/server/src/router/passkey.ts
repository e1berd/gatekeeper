import { authed, pub, rateLimit, refuseWhileImpersonating } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

const settings = authed.use(refuseWhileImpersonating)

export const passkey = {
  registerOptions: settings.passkey.registerOptions.handler(todo('passkey.registerOptions')),
  registerVerify: settings.passkey.registerVerify.handler(todo('passkey.registerVerify')),
  authenticateOptions: pub.passkey.authenticateOptions
    .use(rateLimit('passkey_authenticate'))
    .handler(todo('passkey.authenticateOptions')),
  authenticateVerify: pub.passkey.authenticateVerify
    .use(rateLimit('passkey_authenticate'))
    .handler(todo('passkey.authenticateVerify')),
  list: authed.passkey.list.handler(todo('passkey.list')),
  rename: settings.passkey.rename.handler(todo('passkey.rename')),
  remove: settings.passkey.remove.handler(todo('passkey.remove')),
}
