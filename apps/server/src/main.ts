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

const RPC_PREFIX = '/rpc'
const REST_PREFIX = '/api'

const MAX_REQUEST_BODY_BYTES = 512 * 1024

const STATUS_OK = 200
const STATUS_NOT_FOUND = 404
const STATUS_NOT_IMPLEMENTED = 501

const { db } = createDatabase(config.databaseUrl, { max: config.databasePoolMax })
const humanVerification = createHumanVerificationService(config.humanVerification)

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

function handleStandardsEndpoint(pathname: string): Response | null {
  switch (pathname) {
    case '/.well-known/jwks.json':
      // TODO: serve every non-expired public key from auth.signing_keys
      return Response.json({ keys: [] })

    case '/.well-known/openid-configuration':
      // TODO: hand off to oidc-provider once the OP surface lands
      return Response.json({ issuer: config.issuer }, { status: STATUS_NOT_IMPLEMENTED })

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
  }

  const formResponse = await handleForm(request, context)
  if (formResponse) return formResponse

  const rpcResult = await rpc.handle(request, { prefix: RPC_PREFIX, context })
  if (rpcResult.matched) return rpcResult.response

  const restResult = await rest.handle(request, { prefix: REST_PREFIX, context })
  if (restResult.matched) return restResult.response

  const { pathname } = new URL(request.url)
  return (
    handleStandardsEndpoint(pathname) ?? new Response('Not found', { status: STATUS_NOT_FOUND })
  )
}

if (import.meta.main) {
  startHookDeliveryWorker(db, config.kek)
  Deno.serve({ port: config.port, hostname: '0.0.0.0' }, handler)
  console.log(`gatekeeper listening on :${config.port} (issuer ${config.issuer})`)
}

export { handler, router }
