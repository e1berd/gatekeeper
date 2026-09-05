import { assertEquals, assertRejects } from '@std/assert'
import type { HumanVerificationAction } from '@gatekeeper/contract'
import type { Config } from '../config.ts'
import { createHumanVerificationService, HumanVerificationError } from './human-verification.ts'

type HumanVerificationConfig = Config['humanVerification']

function turnstileConfig(): HumanVerificationConfig {
  return {
    provider: 'turnstile',
    actions: ['sign_up'] as HumanVerificationAction[],
    hostnames: ['id.example.com'],
    timeoutMs: 5_000,
    siteKey: 'public-key',
    secret: 'private-key',
    minimumScore: 0.5,
  }
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status })
}

Deno.test('disabled human verification does not require a token', async () => {
  const service = createHumanVerificationService({
    provider: 'disabled',
    actions: [],
    hostnames: [],
    timeoutMs: 5_000,
  })

  await service.verify('sign_up', undefined, null)
  assertEquals(service.getPublicConfig(), {
    protectedActions: [],
    fieldName: 'human_verification',
    provider: { provider: 'disabled' },
  })
})

Deno.test('protected action requires a human-verification token', async () => {
  const service = createHumanVerificationService(turnstileConfig())

  const error = await assertRejects(
    () => service.verify('sign_up', undefined, null),
    HumanVerificationError,
  )
  assertEquals(error.reason, 'required')
})

Deno.test('turnstile verification binds action, hostname and client IP', async () => {
  let submittedBody = ''
  const fetcher = ((_url: string | URL | Request, init?: RequestInit) => {
    submittedBody = String(init?.body)
    return Promise.resolve(
      jsonResponse({ success: true, action: 'sign_up', hostname: 'id.example.com' }),
    )
  }) as typeof fetch
  const service = createHumanVerificationService(turnstileConfig(), fetcher)

  await service.verify('sign_up', 'browser-token', '192.0.2.1')

  assertEquals(
    new URLSearchParams(submittedBody),
    new URLSearchParams({
      secret: 'private-key',
      response: 'browser-token',
      remoteip: '192.0.2.1',
    }),
  )
  assertEquals(service.getPublicConfig().provider, {
    provider: 'turnstile',
    siteKey: 'public-key',
  })
})

Deno.test('provider rejection fails human verification', async () => {
  const fetcher = (() => Promise.resolve(jsonResponse({ success: false }))) as typeof fetch
  const service = createHumanVerificationService(turnstileConfig(), fetcher)

  const error = await assertRejects(
    () => service.verify('sign_up', 'bad-token', null),
    HumanVerificationError,
  )
  assertEquals(error.reason, 'failed')
})

Deno.test('provider network failure is reported as unavailable', async () => {
  const fetcher = (() => Promise.reject(new TypeError('network failure'))) as typeof fetch
  const service = createHumanVerificationService(turnstileConfig(), fetcher)

  const error = await assertRejects(
    () => service.verify('sign_up', 'token', null),
    HumanVerificationError,
  )
  assertEquals(error.reason, 'unavailable')
})

Deno.test('recaptcha rejects scores below the configured threshold', async () => {
  const fetcher = (() =>
    Promise.resolve(
      jsonResponse({
        success: true,
        action: 'sign_in_password',
        hostname: 'id.example.com',
        score: 0.4,
      }),
    )) as typeof fetch
  const service = createHumanVerificationService(
    {
      provider: 'recaptcha',
      actions: ['sign_in_password'],
      hostnames: ['id.example.com'],
      timeoutMs: 5_000,
      siteKey: 'public-key',
      secret: 'private-key',
      minimumScore: 0.5,
    },
    fetcher,
  )

  const error = await assertRejects(
    () => service.verify('sign_in_password', 'token', null),
    HumanVerificationError,
  )
  assertEquals(error.reason, 'failed')
})
