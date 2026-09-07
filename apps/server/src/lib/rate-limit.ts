import type { RateLimitPolicy } from '@gatekeeper/contract'
import type { KeyValueStore } from './store.ts'
import { sha256Hex } from './tokens.ts'

const WINDOW_SECONDS = 60

export type RateLimitDimension = 'ip' | 'identifier'

export interface RateLimitSubject {
  ip: string | null
  identifier: string | null
}

export interface RateLimitVerdict {
  allowed: boolean
  /** Seconds until the current window closes. Zero when the request is allowed. */
  retryAfter: number
  exceeded: RateLimitDimension | null
}

const ALLOWED: RateLimitVerdict = { allowed: true, retryAfter: 0, exceeded: null }

function windowIndex(): number {
  return Math.floor(Date.now() / 1000 / WINDOW_SECONDS)
}

function secondsUntilWindowCloses(): number {
  return WINDOW_SECONDS - (Math.floor(Date.now() / 1000) % WINDOW_SECONDS)
}

/**
 * Counts one attempt against both budgets and reports whether it may proceed.
 *
 * Identifiers are hashed before they become keys: an email address must not sit
 * in the shared store in the clear. The window is derived from the clock rather
 * than from a stored TTL, so `retryAfter` is exact without a second round trip
 * and every replica agrees on where the window ends.
 */
export async function checkRateLimit(
  store: KeyValueStore,
  action: string,
  subject: RateLimitSubject,
  policy: RateLimitPolicy,
): Promise<RateLimitVerdict> {
  const count = (dimension: RateLimitDimension, value: string) =>
    store.increment(`rl:${action}:${dimension}:${value}:${windowIndex()}`, WINDOW_SECONDS)

  const exceeded = (dimension: RateLimitDimension): RateLimitVerdict => ({
    allowed: false,
    retryAfter: secondsUntilWindowCloses(),
    exceeded: dimension,
  })

  if (subject.ip !== null && (await count('ip', subject.ip)) > policy.perIpPerMinute) {
    return exceeded('ip')
  }

  if (subject.identifier !== null) {
    const hashed = await sha256Hex(subject.identifier.toLowerCase())
    if ((await count('identifier', hashed)) > policy.perIdentifierPerMinute) {
      return exceeded('identifier')
    }
  }

  return ALLOWED
}
