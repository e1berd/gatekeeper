import { deleteCookie, getCookie, setCookie } from '@orpc/server/helpers'
import type { TokenPolicy } from '@gatekeeper/contract'
import { config } from '../config-value.ts'

export const ACCESS_COOKIE = 'gk_at'
export const REFRESH_COOKIE = 'gk_rt'

const COOKIE_DOMAIN = config.browser.cookieDomain ?? undefined
const COOKIES_REQUIRE_HTTPS = config.issuer.startsWith('https://')
const SAME_SITE_THAT_SURVIVES_IDP_REDIRECT = 'lax' as const

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: COOKIES_REQUIRE_HTTPS,
    sameSite: SAME_SITE_THAT_SURVIVES_IDP_REDIRECT,
    path: '/',
    domain: COOKIE_DOMAIN,
    maxAge,
  }
}

/** Writes both session tokens as `HttpOnly` cookies, each outliving the token behind it by nothing. */
export function persistSession(
  headers: Headers,
  tokens: { accessToken: string; refreshToken: string },
  tokenPolicy: TokenPolicy,
): void {
  setCookie(headers, ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokenPolicy.accessTokenTtl))
  setCookie(
    headers,
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(tokenPolicy.refreshTokenTtl),
  )
}

export function clearSession(headers: Headers): void {
  deleteCookie(headers, ACCESS_COOKIE, { path: '/', domain: COOKIE_DOMAIN })
  deleteCookie(headers, REFRESH_COOKIE, { path: '/', domain: COOKIE_DOMAIN })
}

export const readAccessCookie = (headers: Headers): string | undefined =>
  getCookie(headers, ACCESS_COOKIE)

export const readRefreshCookie = (headers: Headers): string | undefined =>
  getCookie(headers, REFRESH_COOKIE)
