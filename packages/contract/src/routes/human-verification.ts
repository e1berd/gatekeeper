import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { HumanVerificationAction } from '../schemas.ts'

const publicProvider = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('disabled') }),
  z.object({ provider: z.enum(['turnstile', 'hcaptcha', 'recaptcha']), siteKey: z.string() }),
  z.object({ provider: z.literal('altcha'), challengeUrl: z.url() }),
])

export const humanVerification = {
  config: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/human-verification/config',
        tags: ['human-verification'],
        summary: 'Describe the configured human-verification provider',
      }),
    )
    .output(
      z.object({
        protectedActions: z.array(HumanVerificationAction),
        fieldName: z.literal('human_verification'),
        provider: publicProvider,
      }),
    ),
}
