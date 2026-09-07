import { authed, pub, rateLimit, refuseWhileImpersonating } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

const settings = authed.use(refuseWhileImpersonating)

export const mfa = {
  enrollTotp: settings.mfa.enrollTotp.handler(todo('mfa.enrollTotp')),
  verifyTotpEnrolment: settings.mfa.verifyTotpEnrolment.handler(todo('mfa.verifyTotpEnrolment')),
  verifyChallenge: pub.mfa.verifyChallenge
    .use(rateLimit('mfa_challenge'))
    .handler(todo('mfa.verifyChallenge')),
  stepUp: settings.mfa.stepUp.handler(todo('mfa.stepUp')),
  listFactors: authed.mfa.listFactors.handler(todo('mfa.listFactors')),
  removeFactor: settings.mfa.removeFactor.handler(todo('mfa.removeFactor')),
  regenerateRecoveryCodes: settings.mfa.regenerateRecoveryCodes.handler(
    todo('mfa.regenerateRecoveryCodes'),
  ),
}
