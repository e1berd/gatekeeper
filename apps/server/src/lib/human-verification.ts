import type { HumanVerificationAction } from '@gatekeeper/contract'
import { verifyServer } from 'altcha-lib'
import type { Config } from '../config.ts'

type HumanVerificationConfig = Config['humanVerification']

export type HumanVerificationFailure = 'required' | 'failed' | 'unavailable'

export class HumanVerificationError extends Error {
  constructor(readonly reason: HumanVerificationFailure) {
    super(`Human verification ${reason}`)
    this.name = 'HumanVerificationError'
  }
}

export interface HumanVerificationService {
  getPublicConfig(): {
    protectedActions: HumanVerificationAction[]
    fieldName: 'human_verification'
    provider:
      | { provider: 'disabled' }
      | { provider: 'turnstile' | 'hcaptcha' | 'recaptcha'; siteKey: string }
      | { provider: 'altcha'; challengeUrl: string }
  }
  verify(
    action: HumanVerificationAction,
    token: string | undefined,
    ip: string | null,
  ): Promise<void>
}

type SiteVerifyResponse = {
  success?: boolean
  hostname?: string
  action?: string
  score?: number
}

const SITE_VERIFY_URLS = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
} as const

function actionIsValid(
  provider: 'turnstile' | 'hcaptcha' | 'recaptcha',
  response: SiteVerifyResponse,
  action: HumanVerificationAction,
): boolean {
  if (provider === 'hcaptcha') return true
  return response.action === undefined || response.action === action
}

function hostnameIsValid(hostnames: readonly string[], hostname: string | undefined): boolean {
  return hostnames.length === 0 || (hostname !== undefined && hostnames.includes(hostname))
}

async function postForm(
  url: string,
  body: URLSearchParams,
  timeoutMs: number,
  fetcher: typeof fetch,
): Promise<unknown> {
  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`Verification provider returned ${response.status}`)
  return await response.json()
}

export function createHumanVerificationService(
  config: HumanVerificationConfig,
  fetcher: typeof fetch = fetch,
): HumanVerificationService {
  const protectedActions = new Set<HumanVerificationAction>(
    config.actions as HumanVerificationAction[],
  )

  return {
    getPublicConfig: () => ({
      protectedActions: [...protectedActions],
      fieldName: 'human_verification',
      provider:
        config.provider === 'disabled'
          ? { provider: 'disabled' }
          : config.provider === 'altcha'
            ? { provider: 'altcha', challengeUrl: config.challengeUrl }
            : { provider: config.provider, siteKey: config.siteKey },
    }),

    verify: async (action, token, ip) => {
      if (!protectedActions.has(action)) return
      if (!token) throw new HumanVerificationError('required')
      if (config.provider === 'disabled') throw new HumanVerificationError('unavailable')

      try {
        if (config.provider === 'altcha') {
          const response = await verifyServer({
            payload: token,
            url: config.verifyUrl,
            secret: config.secret ?? undefined,
            fetch: fetcher,
            timeout: config.timeoutMs,
          })
          if (!response.verified) {
            if (
              response.reason === 'ABORTED' ||
              response.reason === 'NETWORK_ERROR' ||
              response.reason?.startsWith('HTTP_')
            ) {
              throw new HumanVerificationError('unavailable')
            }
            throw new HumanVerificationError('failed')
          }
          return
        }

        const body = new URLSearchParams({ secret: config.secret, response: token })
        if (ip) body.set('remoteip', ip)
        if (config.provider === 'hcaptcha') body.set('sitekey', config.siteKey)
        const response = (await postForm(
          SITE_VERIFY_URLS[config.provider],
          body,
          config.timeoutMs,
          fetcher,
        )) as SiteVerifyResponse
        const scoreIsValid =
          config.provider !== 'recaptcha' || (response.score ?? 0) >= config.minimumScore
        if (
          !response.success ||
          !scoreIsValid ||
          !actionIsValid(config.provider, response, action) ||
          !hostnameIsValid(config.hostnames, response.hostname)
        ) {
          throw new HumanVerificationError('failed')
        }
      } catch (error) {
        if (error instanceof HumanVerificationError) throw error
        throw new HumanVerificationError('unavailable')
      }
    },
  }
}
