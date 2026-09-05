import { assertEquals, assertThrows } from '@std/assert'
import { loadConfig, parseConfig } from './config.ts'

const MINIMAL_CONFIG = `
database:
  url: postgres://gatekeeper:gatekeeper@localhost/gatekeeper
security:
  kek: test-key
`

Deno.test('parseConfig applies defaults and issuer-based browser origins', () => {
  const config = parseConfig(MINIMAL_CONFIG)

  assertEquals(config.port, 8080)
  assertEquals(config.databasePoolMax, 10)
  assertEquals(config.browser.allowedFormOrigins, ['http://localhost:8080'])
  assertEquals(config.humanVerification, {
    provider: 'disabled',
    actions: [],
    hostnames: [],
    timeoutMs: 5_000,
  })
})

Deno.test('parseConfig validates ALTCHA settings', () => {
  const config = parseConfig(`
database:
  url: postgres://gatekeeper:gatekeeper@localhost/gatekeeper
security:
  kek: test-key
humanVerification:
  provider: altcha
  actions: [sign_up, sign_in_password]
  challengeUrl: https://sentinel.example.com/v1/challenge
  verifyUrl: https://sentinel.example.com/v1/verify/signature
`)

  assertEquals(config.humanVerification.provider, 'altcha')
  assertEquals(config.humanVerification.actions, ['sign_up', 'sign_in_password'])
})

Deno.test('parseConfig rejects unknown keys', () => {
  assertThrows(() => parseConfig(`${MINIMAL_CONFIG}\nunknown: true\n`))
})

Deno.test('loadConfig accepts both config argument forms', async () => {
  const directory = await Deno.makeTempDir()
  const path = `${directory}/custom.yaml`
  await Deno.writeTextFile(path, MINIMAL_CONFIG)

  try {
    assertEquals(loadConfig(['--config', path]), loadConfig([`--config=${path}`]))
  } finally {
    await Deno.remove(directory, { recursive: true })
  }
})
