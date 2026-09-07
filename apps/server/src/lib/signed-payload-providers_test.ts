import { assert, assertEquals } from '@std/assert'
import { findSignedPayloadProvider } from './signed-payload-providers.ts'

const BOT_TOKEN = '123456:AAH-test-bot-token'
const MAX_AGE_SECONDS = 86_400

const telegram = findSignedPayloadProvider('telegram')
assert(telegram)

async function hmac(key: BufferSource, message: string): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  return new Uint8Array(
    await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)),
  )
}

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

async function initData(fields: Record<string, string>, token = BOT_TOKEN): Promise<string> {
  const checkString = Object.entries(fields)
    .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const key = await hmac(new TextEncoder().encode('WebAppData'), token)
  const params = new URLSearchParams(fields)
  params.set('hash', toHex(await hmac(key, checkString)))

  return params.toString()
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

const user = JSON.stringify({
  id: 4242,
  username: 'someone',
  first_name: 'Пример',
  last_name: 'Пользователь',
  photo_url: 'https://t.me/i/userpic/320/someone.jpg',
})

Deno.test('a correctly signed payload yields the profile behind it', async () => {
  const payload = await initData({ user, auth_date: String(nowSeconds()) })
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assert(result.ok)
  assertEquals(result.profile.providerUserId, '4242')
  assertEquals(result.profile.name, 'someone')
  assertEquals(result.profile.avatarUrl, 'https://t.me/i/userpic/320/someone.jpg')
  assertEquals(result.profile.email, null)
  assertEquals(result.profile.emailVerified, false)
})

Deno.test('a payload signed with another bot token is rejected', async () => {
  const payload = await initData({ user, auth_date: String(nowSeconds()) }, '999:other-token')
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assertEquals(result, { ok: false, reason: 'bad_signature' })
})

Deno.test('editing any field after signing is rejected', async () => {
  const payload = await initData({ user, auth_date: String(nowSeconds()) })
  const tampered = payload.replace('4242', '9999')
  const result = await telegram.verify(tampered, BOT_TOKEN, MAX_AGE_SECONDS)

  assertEquals(result, { ok: false, reason: 'bad_signature' })
})

Deno.test('a payload without a hash is malformed', async () => {
  const result = await telegram.verify(
    new URLSearchParams({ user, auth_date: String(nowSeconds()) }).toString(),
    BOT_TOKEN,
    MAX_AGE_SECONDS,
  )

  assertEquals(result, { ok: false, reason: 'malformed' })
})

Deno.test('a payload older than the freshness window is rejected', async () => {
  const stale = String(nowSeconds() - MAX_AGE_SECONDS - 60)
  const payload = await initData({ user, auth_date: stale })
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assertEquals(result, { ok: false, reason: 'expired' })
})

Deno.test('a signed payload carrying no user is malformed', async () => {
  const payload = await initData({ auth_date: String(nowSeconds()) })
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assertEquals(result, { ok: false, reason: 'malformed' })
})

Deno.test('a signed payload with no auth_date is malformed', async () => {
  const payload = await initData({ user })
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assertEquals(result, { ok: false, reason: 'malformed' })
})

Deno.test('a name falls back to the first and last name when there is no username', async () => {
  const named = JSON.stringify({ id: 7, first_name: 'Ada', last_name: 'Lovelace' })
  const payload = await initData({ user: named, auth_date: String(nowSeconds()) })
  const result = await telegram.verify(payload, BOT_TOKEN, MAX_AGE_SECONDS)

  assert(result.ok)
  assertEquals(result.profile.name, 'Ada Lovelace')
})
