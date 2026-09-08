import { sql } from 'drizzle-orm'
import { call } from '@orpc/server'
import { getCookie, setCookie, sign, unsign } from '@orpc/server/helpers'
import { isDefinedError, ORPCError } from '@orpc/client'
import { router } from './router/mod.ts'
import { config } from './config-value.ts'
import type { InitialContext } from './context.ts'
import type { AuthResult, TokenPolicy } from '@gatekeeper/contract'
import { resolveRealmBySlug } from './lib/realm.ts'
import { toAllowedRedirect as resolveRedirect } from './lib/redirects.ts'
import { sha256Hex } from './lib/tokens.ts'
import {
  ACCESS_COOKIE,
  clearSession,
  cookieOptions,
  persistSession,
  readRefreshCookie,
} from './lib/session-cookies.ts'

const FORM_PREFIX = '/form/'

const CSRF_COOKIE = 'gk_csrf'
const MFA_CHALLENGE_COOKIE = 'gk_mfa'

const CSRF_TOKEN_TTL_SECONDS = 3600
const MFA_CHALLENGE_TTL_SECONDS = 300

const STATUS_SEE_OTHER_SO_REFRESH_CANNOT_RESUBMIT = 303
const STATUS_NO_CONTENT = 204
const STATUS_METHOD_NOT_ALLOWED = 405
const STATUS_NOT_FOUND = 404
const STATUS_PAYLOAD_TOO_LARGE = 413

const MAX_FORM_BODY_BYTES = 1024 * 1024

const ALLOWED_REDIRECT_ORIGINS = config.browser.allowedRedirectOrigins
const ALLOWED_FORM_ORIGINS = config.browser.allowedFormOrigins

const toAllowedRedirect = (candidate: string | null, fallback: string): string =>
  resolveRedirect(candidate, ALLOWED_REDIRECT_ORIGINS, fallback)

function redirect(location: string, headers: Headers): Response {
  headers.set('location', location)
  return new Response(null, { status: STATUS_SEE_OTHER_SO_REFRESH_CANNOT_RESUBMIT, headers })
}

function realmSlugFrom(request: Request): string {
  return request.headers.get('x-gatekeeper-realm') ?? 'master'
}

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

type OriginVerdict = 'trusted' | 'forged' | 'absent'

function classifySubmittingOrigin(request: Request): OriginVerdict {
  const origin = request.headers.get('origin')
  if (origin === null) return 'absent'
  return ALLOWED_FORM_ORIGINS.includes(origin) ? 'trusted' : 'forged'
}

async function hasValidCsrfToken(request: Request, form: FormData): Promise<boolean> {
  const submitted = field(form, 'csrf')
  if (!submitted) return false

  const signedCookie = getCookie(request.headers, CSRF_COOKIE)
  const issued = await unsign(signedCookie, config.kek)
  return issued !== undefined && issued === submitted
}

export async function issueCsrfToken(headers: Headers): Promise<string> {
  const token = crypto.randomUUID()
  setCookie(
    headers,
    CSRF_COOKIE,
    await sign(token, config.kek),
    cookieOptions(CSRF_TOKEN_TTL_SECONDS),
  )
  return token
}

function redirectBackWithError(
  request: Request,
  form: FormData,
  code: string,
  headers: Headers,
): Response {
  const back = toAllowedRedirect(
    field(form, 'error_redirect_to') || request.headers.get('referer'),
    config.issuer,
  )
  const target = new URL(back)
  target.searchParams.set('error', code)
  return redirect(target.toString(), headers)
}

function withCookieSession(request: Request, base: InitialContext): InitialContext {
  const accessToken = getCookie(request.headers, ACCESS_COOKIE)
  if (!accessToken) return base

  const headers = new Headers(request.headers)
  headers.set('authorization', `Bearer ${accessToken}`)
  return { ...base, headers }
}

function metadataPatch(form: FormData): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const displayName = field(form, 'display_name')
  if (displayName) patch.displayName = displayName
  const locale = field(form, 'locale')
  if (locale) patch.locale = locale
  return patch
}

async function handleProfileUpdate(
  request: Request,
  form: FormData,
  headers: Headers,
  context: InitialContext,
): Promise<Response> {
  const authedContext = withCookieSession(request, context)

  const patch = metadataPatch(form)
  if (Object.keys(patch).length > 0) {
    await call(router.profile.update, { userWritableMetadata: patch }, { context: authedContext })
  }

  const avatar = form.get('avatar')
  if (avatar instanceof File && avatar.size > 0) {
    await call(router.profile.uploadAvatar, avatar, { context: authedContext })
  } else if (field(form, 'remove_avatar') === 'true') {
    await call(router.profile.removeAvatar, undefined, { context: authedContext })
  }

  return redirect(toAllowedRedirect(field(form, 'redirect_to'), config.issuer), headers)
}

async function submitCredentials(
  action: 'sign-up' | 'sign-in',
  form: FormData,
  context: InitialContext,
) {
  const email = field(form, 'email')
  const password = field(form, 'password')
  const humanVerification =
    field(form, 'human_verification') ||
    field(form, 'cf-turnstile-response') ||
    field(form, 'h-captcha-response') ||
    field(form, 'g-recaptcha-response') ||
    field(form, 'altcha') ||
    undefined

  return action === 'sign-up'
    ? await call(
        router.auth.signUp,
        { email, password, userWritableMetadata: {}, humanVerification },
        { context },
      )
    : await call(router.auth.signInPassword, { email, password, humanVerification }, { context })
}

function landAuthResult(
  result: AuthResult,
  request: Request,
  form: FormData,
  headers: Headers,
  tokenPolicy: TokenPolicy,
): Response {
  if (result.status === 'mfa_required') {
    setCookie(
      headers,
      MFA_CHALLENGE_COOKIE,
      result.challengeToken,
      cookieOptions(MFA_CHALLENGE_TTL_SECONDS),
    )
    return redirect(
      toAllowedRedirect(field(form, 'mfa_redirect_to'), `${config.issuer}/mfa`),
      headers,
    )
  }

  if (result.status === 'verification_required') {
    return redirectBackWithError(request, form, `verify_${result.reason}`, headers)
  }

  persistSession(headers, result.tokens, tokenPolicy)
  return redirect(toAllowedRedirect(field(form, 'redirect_to'), config.issuer), headers)
}

async function handleCredentialSubmission(
  action: 'sign-up' | 'sign-in',
  request: Request,
  form: FormData,
  headers: Headers,
  context: InitialContext,
  tokenPolicy: TokenPolicy,
): Promise<Response> {
  const result = await submitCredentials(action, form, context)
  return landAuthResult(result, request, form, headers, tokenPolicy)
}

async function handleSignOut(
  form: FormData,
  headers: Headers,
  context: InitialContext,
): Promise<Response> {
  await call(router.auth.signOut, { scope: 'local' }, { context })
  clearSession(headers)
  return redirect(toAllowedRedirect(field(form, 'redirect_to'), config.issuer), headers)
}

function allowCredentialedOrigin(request: Request, headers: Headers): void {
  const origin = request.headers.get('origin')
  if (!origin || !ALLOWED_FORM_ORIGINS.includes(origin)) return

  headers.set('access-control-allow-origin', origin)
  headers.set('access-control-allow-credentials', 'true')
  headers.append('vary', 'origin')
}

/** Opens a social sign-in whose session lands in `HttpOnly` cookies, not a URL code. */
async function handleOAuthStart(
  form: FormData,
  headers: Headers,
  context: InitialContext,
): Promise<Response> {
  const { authorizationUrl, state } = await call(
    router.auth.oauthStart,
    { provider: field(form, 'provider'), redirectTo: field(form, 'redirect_to') || undefined },
    { context },
  )

  await context.db.execute(sql`
    update auth.flow_state set session_sink = 'cookie' where state_hash = ${await sha256Hex(state)}
  `)

  return redirect(authorizationUrl, headers)
}

async function handleSignedPayload(
  request: Request,
  form: FormData,
  headers: Headers,
  context: InitialContext,
  tokenPolicy: TokenPolicy,
): Promise<Response> {
  const result = await call(
    router.auth.verifySignedPayload,
    { provider: field(form, 'provider') || 'telegram', payload: field(form, 'payload') },
    { context },
  )

  return landAuthResult(result, request, form, headers, tokenPolicy)
}

/** Rotates the session from the `gk_rt` cookie alone; the refresh token never reaches a client. */
async function handleRefresh(
  request: Request,
  headers: Headers,
  context: InitialContext,
  tokenPolicy: TokenPolicy,
): Promise<Response> {
  const refreshToken = readRefreshCookie(request.headers)

  if (refreshToken) {
    try {
      persistSession(
        headers,
        await call(router.auth.refresh, { refreshToken }, { context }),
        tokenPolicy,
      )
    } catch {
      clearSession(headers)
    }
  }

  return new Response(null, { status: STATUS_NO_CONTENT, headers })
}

export async function handleForm(
  request: Request,
  context: InitialContext,
): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  if (!pathname.startsWith(FORM_PREFIX)) return null

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: STATUS_METHOD_NOT_ALLOWED })
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FORM_BODY_BYTES) {
    return new Response('Payload too large', { status: STATUS_PAYLOAD_TOO_LARGE })
  }

  const action = pathname.slice(FORM_PREFIX.length)
  const form = await request.formData()
  const headers = new Headers()
  allowCredentialedOrigin(request, headers)

  const originVerdict = classifySubmittingOrigin(request)
  if (originVerdict === 'forged') {
    return redirectBackWithError(request, form, 'untrusted_origin', headers)
  }

  const originIsUnprovable = originVerdict === 'absent'
  if (originIsUnprovable && !(await hasValidCsrfToken(request, form))) {
    return redirectBackWithError(request, form, 'csrf_failed', headers)
  }

  const realm = await resolveRealmBySlug(context.db, realmSlugFrom(request))
  if (!realm) return redirectBackWithError(request, form, 'unknown_realm', headers)

  try {
    switch (action) {
      case 'sign-up':
      case 'sign-in':
        return await handleCredentialSubmission(
          action,
          request,
          form,
          headers,
          context,
          realm.settings.tokens,
        )
      case 'sign-out':
        return await handleSignOut(form, headers, withCookieSession(request, context))
      case 'oauth-start':
        return await handleOAuthStart(form, headers, context)
      case 'signed-payload':
        return await handleSignedPayload(request, form, headers, context, realm.settings.tokens)
      case 'refresh':
        return await handleRefresh(request, headers, context, realm.settings.tokens)
      case 'profile':
        return await handleProfileUpdate(request, form, headers, context)
      default:
        return new Response('Not found', { status: STATUS_NOT_FOUND })
    }
  } catch (error) {
    const code = isDefinedError(error) || error instanceof ORPCError ? error.code : 'internal_error'
    return redirectBackWithError(request, form, code.toLowerCase(), headers)
  }
}
