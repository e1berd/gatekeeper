import { authed, pub } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const mfa = {
  enrollTotp: authed.mfa.enrollTotp.handler(todo('mfa.enrollTotp')),
  verifyTotpEnrolment: authed.mfa.verifyTotpEnrolment.handler(todo('mfa.verifyTotpEnrolment')),
  verifyChallenge: pub.mfa.verifyChallenge.handler(todo('mfa.verifyChallenge')),
  stepUp: authed.mfa.stepUp.handler(todo('mfa.stepUp')),
  listFactors: authed.mfa.listFactors.handler(todo('mfa.listFactors')),
  removeFactor: authed.mfa.removeFactor.handler(todo('mfa.removeFactor')),
  regenerateRecoveryCodes: authed.mfa.regenerateRecoveryCodes.handler(
    todo('mfa.regenerateRecoveryCodes'),
  ),
}
