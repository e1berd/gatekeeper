import { authed, pub } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const auth = {
  signUp: pub.auth.signUp.handler(todo('auth.signUp')),
  signInPassword: pub.auth.signInPassword.handler(todo('auth.signInPassword')),
  signInOtp: pub.auth.signInOtp.handler(todo('auth.signInOtp')),
  verifyOtp: pub.auth.verifyOtp.handler(todo('auth.verifyOtp')),
  refresh: pub.auth.refresh.handler(todo('auth.refresh')),
  signOut: authed.auth.signOut.handler(todo('auth.signOut')),
  getSession: authed.auth.getSession.handler(todo('auth.getSession')),
  verifyEmail: pub.auth.verifyEmail.handler(todo('auth.verifyEmail')),
  requestPasswordReset: pub.auth.requestPasswordReset.handler(todo('auth.requestPasswordReset')),
  resetPassword: pub.auth.resetPassword.handler(todo('auth.resetPassword')),
  changePassword: authed.auth.changePassword.handler(todo('auth.changePassword')),
  listSessions: authed.auth.listSessions.handler(todo('auth.listSessions')),
  revokeSession: authed.auth.revokeSession.handler(todo('auth.revokeSession')),
  oauthStart: pub.auth.oauthStart.handler(todo('auth.oauthStart')),
  oauthExchange: pub.auth.oauthExchange.handler(todo('auth.oauthExchange')),
  switchOrg: authed.auth.switchOrg.handler(todo('auth.switchOrg')),
}
