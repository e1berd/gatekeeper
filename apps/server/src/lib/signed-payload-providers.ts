import * as z from 'zod'

import { timingSafeEquals } from './tokens.ts'
import type { OAuthProfile } from './oauth-providers.ts'

const HMAC = { name: 'HMAC', hash: 'SHA-256' } as const
const TELEGRAM_HMAC_SEED = 'WebAppData'
const HASH_FIELD = 'hash'
const SECONDS_PER_MILLISECOND = 1000

export type SignedPayloadFailure = 'malformed' | 'bad_signature' | 'expired'

export type SignedPayloadResult =
  | { ok: true; profile: OAuthProfile }
  | { ok: false; reason: SignedPayloadFailure }

/**
 * A provider that proves identity with a payload it signed itself, rather than
 * with an authorization-code redirect. The caller hands the blob straight to
 * Gatekeeper, so there is no state to keep between two requests.
 */
export interface SignedPayloadProvider {
  slug: string
  verify(payload: string, secret: string, maxAgeSeconds: number): Promise<SignedPayloadResult>
}

async function hmac(key: BufferSource, message: string): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, HMAC, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))

  return new Uint8Array(signature)
}

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const TelegramUser = z.object({
  id: z.number().int(),
  username: z.string().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  photo_url: z.url().nullish(),
})

function dataCheckString(params: URLSearchParams): string {
  return [...params]
    .filter(([key]) => key !== HASH_FIELD)
    .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function telegramProfile(raw: string): OAuthProfile | null {
  const parsed = TelegramUser.safeParse(JSON.parse(raw) as unknown)
  if (!parsed.success) return null

  const user = parsed.data
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  return {
    providerUserId: String(user.id),
    email: null,
    emailVerified: false,
    name: user.username ?? (fullName || null),
    avatarUrl: user.photo_url ?? null,
  }
}

/**
 * The Telegram Mini Apps scheme: an HMAC over the sorted data-check-string whose
 * key is itself an HMAC of the bot token, plus a freshness window against replay.
 * `initData` is an entry ticket, never a session.
 *
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
const telegram: SignedPayloadProvider = {
  slug: 'telegram',

  async verify(payload, secret, maxAgeSeconds) {
    const params = new URLSearchParams(payload)
    const presented = params.get(HASH_FIELD)
    if (!presented) return { ok: false, reason: 'malformed' }

    const key = await hmac(new TextEncoder().encode(TELEGRAM_HMAC_SEED), secret)
    const expected = toHex(await hmac(key, dataCheckString(params)))

    if (!timingSafeEquals(expected, presented)) return { ok: false, reason: 'bad_signature' }

    const authDate = Number(params.get('auth_date'))
    if (!Number.isFinite(authDate) || authDate === 0) return { ok: false, reason: 'malformed' }

    if (Date.now() / SECONDS_PER_MILLISECOND - authDate > maxAgeSeconds) {
      return { ok: false, reason: 'expired' }
    }

    const raw = params.get('user')
    const profile = raw ? telegramProfile(raw) : null

    return profile ? { ok: true, profile } : { ok: false, reason: 'malformed' }
  },
}

const PROVIDERS: readonly SignedPayloadProvider[] = [telegram]

export function findSignedPayloadProvider(slug: string): SignedPayloadProvider | undefined {
  return PROVIDERS.find((provider) => provider.slug === slug)
}
