import { RPCHandler } from '@orpc/server/fetch'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import {
  CORSHandlerPlugin,
  PrototypePollutionProtectionHandlerPlugin,
  RequestLimitHandlerPlugin,
} from '@orpc/server/plugins'
import { onError } from '@orpc/server'
import { createDatabase } from '@gatekeeper/db'
import { config } from './config-value.ts'
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

function logError(error: unknown) {
  // TODO: structured logging plus an audit-log write for auth failures
  console.error('[gatekeeper]', error)
}

const rpc = new RPCHandler(router, {
  plugins: sharedPlugins(),
  interceptors: [onError(logError)],
})

const rest = new OpenAPIHandler(router, {
  plugins: sharedPlugins(),
  interceptors: [onError(logError)],
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

async function handleOAuthCallback(url: URL): Promise<Response | null> {
  const slug = OAUTH_CALLBACK.exec(url.pathname)?.[1]
  if (!slug) return null

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return new Response('Missing code or state', { status: STATUS_BAD_REQUEST })
  }

  try {
    const location = await completeOAuthCallback(oauth, slug, code, state)
    return new Response(null, { status: SEE_OTHER, headers: { location } })
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
    (await handleOAuthCallback(url)) ??
    (await handleStandardsEndpoint(url.pathname)) ??
    new Response('Not found', { status: STATUS_NOT_FOUND })
  )
}

if (import.meta.main) {
  await signingKeys.bootstrap()
  startHookDeliveryWorker(db, config.kek)
  Deno.serve({ port: config.port, hostname: '0.0.0.0' }, handler)
  console.log(`gatekeeper listening on :${config.port} (issuer ${config.issuer})`)
}

export { handler, router }
