import { os } from '../middleware.ts'

export const humanVerification = {
  config: os.humanVerification.config.handler(({ context }) =>
    context.humanVerification.getPublicConfig(),
  ),
}
