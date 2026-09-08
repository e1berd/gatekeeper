import { RPCHandler } from '@orpc/server/fetch'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import {
  CORSHandlerPlugin,
  PrototypePollutionProtectionHandlerPlugin,
  RequestLimitHandlerPlugin,
} from '@orpc/server/plugins'
import { call, onError, ORPCError } from '@orpc/server'
import { createDatabase } from '@gatekeeper/db'
import { runMigrations } from '@gatekeeper/db/migrate'
import { config } from './config-value.ts'
import { ERROR_STATUS_MAP } from './error-status.ts'
import { localizeErrorMessage, resolveLanguage } from './i18n.ts'
import { router } from './router/mod.ts'
import type { InitialContext } from './context.ts'
import { handleForm } from './forms.ts'
import { startHookDeliveryWorker } from './lib/hook-delivery.ts'
import { createHumanVerificationService } from './lib/human-verification.ts'
import { createSecretStore } from './lib/secrets.ts'
import { createSigningKeys, DEFAULT_SIGNING_ALGORITHM } from './lib/keys.ts'
import { createTokenService } from './lib/tokens.ts'
import { createStore } from './lib/store.ts'
import { createMailer } from './lib/mail.ts'
import { FlowError } from './lib/flows.ts'
import type { OAuthDeps } from './lib/oauth.ts'
import { completeOAuthCallback } from './lib/oauth-callback.ts'
import { resolveRealmBySlug } from './lib/realm.ts'
import { persistSession } from './lib/session-cookies.ts'

const RPC_PREFIX = '/rpc'
const REST_PREFIX = '/api'

const MAX_REQUEST_BODY_BYTES = 512 * 1024

const STATUS_OK = 200
const SEE_OTHER = 303
const STATUS_NOT_FOUND = 404

const { db } = createDatabase(config.databaseUrl, { max: config.databasePoolMax })
const humanVerification = createHumanVerificationService(config.humanVerification)
const secrets = createSecretStore(db, config.kek)
const signingKeys = createSigningKeys(db, secrets, config.signingKey)
const tokens = createTokenService(signingKeys, config.issuer)
const store = await createStore(config.redisUrl)
const mailer = createMailer(config.mail)

const oauth: OAuthDeps = {
  db,
  secrets,
  providers: config.oauth,
  issuer: config.issuer,
  allowedRedirectOrigins: config.browser.allowedRedirectOrigins,
}

const sharedPlugins = () => [
  new CORSHandlerPlugin({
    origin: config.browser.corsAllowedOrigins,
    credentials: true,
    allowHeaders: ['content-type', 'authorization', 'x-gatekeeper-realm'],
  }),
  new PrototypePollutionProtectionHandlerPlugin(),
  new RequestLimitHandlerPlugin({ maxBodySize: MAX_REQUEST_BODY_BYTES }),
]

function isExpectedClientError(error: unknown): error is ORPCError<string, unknown> {
  return error instanceof ORPCError && error.defined && (ERROR_STATUS_MAP[error.code] ?? 500) < 500
}

function logError(error: unknown) {
  // TODO: structured logging plus an audit-log write for auth failures
  if (isExpectedClientError(error)) return
  console.error('[gatekeeper]', error)
}

/** Rewrites the English fallback `message` of a typed error into the caller's language. */
function localizeError(error: unknown, acceptLanguage: string | null): void {
  if (!(error instanceof ORPCError)) return
  const message = localizeErrorMessage(error.code, resolveLanguage(acceptLanguage))
  if (message) error.message = message
}

const rpc = new RPCHandler(router, {
  plugins: sharedPlugins(),
  interceptors: [onError(logError)],
  errorStatusMap: ERROR_STATUS_MAP,
  clientInterceptors: [
    async ({ next, context }) => {
      try {
        return await next()
      } catch (error) {
        localizeError(error, context.headers.get('accept-language'))
        throw error
      }
    },
  ],
})

const rest = new OpenAPIHandler(router, {
  plugins: sharedPlugins(),
  interceptors: [onError(logError)],
  errorStatusMap: ERROR_STATUS_MAP,
  clientInterceptors: [
    async ({ next, context }) => {
      try {
        return await next()
      } catch (error) {
        localizeError(error, context.headers.get('accept-language'))
        throw error
      }
    },
  ],
})

function resolveClientIp(request: Request, info: Deno.ServeHandlerInfo): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded && config.browser.trustProxy) {
    return forwarded.split(',')[0]?.trim() ?? null
  }

  const address = info.remoteAddr
  return address.transport === 'tcp' ? address.hostname : null
}

const NOT_AN_OPENID_PROVIDER_YET: string[] = []

function discoveryDocument() {
  return {
    issuer: config.issuer,
    jwks_uri: `${config.issuer}/.well-known/jwks.json`,
    id_token_signing_alg_values_supported: [DEFAULT_SIGNING_ALGORITHM, 'EdDSA'],
    subject_types_supported: ['public'],
    response_types_supported: NOT_AN_OPENID_PROVIDER_YET,
    grant_types_supported: NOT_AN_OPENID_PROVIDER_YET,
  }
}

const OAUTH_CALLBACK = /^\/oauth\/([a-z0-9][a-z0-9._-]*)\/callback$/
const STATUS_BAD_REQUEST = 400

async function redirectWithSessionCookies(
  request: Request,
  context: InitialContext,
  outcome: { code: string; location: string },
): Promise<Response> {
  const realmSlug = request.headers.get('x-gatekeeper-realm') ?? 'master'
  const realm = await resolveRealmBySlug(context.db, realmSlug)
  if (!realm) return new Response('unknown_realm', { status: STATUS_BAD_REQUEST })

  const result = await call(router.auth.oauthExchange, { code: outcome.code }, { context })
  const target = new URL(outcome.location)

  if (result.status !== 'authenticated') {
    target.searchParams.set('error', result.status)
    return new Response(null, { status: SEE_OTHER, headers: { location: target.toString() } })
  }

  const headers = new Headers({ location: target.toString() })
  persistSession(headers, result.tokens, realm.settings.tokens)
  return new Response(null, { status: SEE_OTHER, headers })
}

async function handleOAuthCallback(
  request: Request,
  context: InitialContext,
): Promise<Response | null> {
  const url = new URL(request.url)
  const slug = OAUTH_CALLBACK.exec(url.pathname)?.[1]
  if (!slug) return null

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return new Response('Missing code or state', { status: STATUS_BAD_REQUEST })
  }

  try {
    const outcome = await completeOAuthCallback(oauth, slug, code, state)

    return outcome.sessionSink === 'cookie'
      ? await redirectWithSessionCookies(request, context, outcome)
      : new Response(null, { status: SEE_OTHER, headers: { location: outcome.location } })
  } catch (error) {
    logError(error)

    const reason = error instanceof FlowError ? error.failure.code : 'OAUTH_FAILED'
    return new Response(reason, { status: STATUS_BAD_REQUEST })
  }
}

async function handleStandardsEndpoint(pathname: string): Promise<Response | null> {
  switch (pathname) {
    case '/.well-known/jwks.json':
      return Response.json({ keys: await signingKeys.publicJwks() })

    case '/.well-known/openid-configuration':
      return Response.json(discoveryDocument())

    case '/healthz':
      return new Response('ok', { status: STATUS_OK })

    default:
      return null
  }
}

async function handler(request: Request, info: Deno.ServeHandlerInfo): Promise<Response> {
  const context: InitialContext = {
    db,
    headers: request.headers,
    ip: resolveClientIp(request, info),
    humanVerification,
    store,
    mailer,
    secrets,
    signingKeys,
    tokens,
  }

  const formResponse = await handleForm(request, context)
  if (formResponse) return formResponse

  const rpcResult = await rpc.handle(request, { prefix: RPC_PREFIX, context })
  if (rpcResult.matched) return rpcResult.response

  const restResult = await rest.handle(request, { prefix: REST_PREFIX, context })
  if (restResult.matched) return restResult.response

  const url = new URL(request.url)
  return (
    (await handleOAuthCallback(request, context)) ??
    (await handleStandardsEndpoint(url.pathname)) ??
    new Response('Not found', { status: STATUS_NOT_FOUND })
  )
}

if (import.meta.main) {
  await runMigrations(config.databaseUrl)
  await signingKeys.bootstrap()
  startHookDeliveryWorker(db, config.kek)
  Deno.serve({ port: config.port, hostname: '0.0.0.0' }, handler)
  console.log(`gatekeeper listening on :${config.port} (issuer ${config.issuer})`)
}

export { handler, router }
