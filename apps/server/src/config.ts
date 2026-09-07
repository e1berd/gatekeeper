import { parse as parseYaml } from '@std/yaml'
import * as z from 'zod'
import { HumanVerificationAction } from '@gatekeeper/contract'

const DEFAULT_CONFIG_PATH = 'gatekeeper.yaml'

const ServerConfig = z.strictObject({
  port: z.number().int().min(1).max(65_535).default(8080),
  issuer: z.url().default('http://localhost:8080'),
  logLevel: z.string().min(1).default('info'),
  version: z.string().min(1).default('0.1.0'),
})

const DatabaseConfig = z.strictObject({
  url: z.string().min(1),
  poolMax: z.number().int().min(1).default(10),
})

const SecurityConfig = z.strictObject({
  kek: z.string().min(1),
  signingKey: z.string().min(1).nullable().default(null),
})

const BrowserConfig = z.strictObject({
  cookieDomain: z.string().min(1).nullable().default(null),
  allowedRedirectOrigins: z.array(z.url()).optional(),
  allowedFormOrigins: z.array(z.url()).optional(),
  corsAllowedOrigins: z.array(z.url()).optional(),
  trustProxy: z.boolean().default(false),
})

const WebAuthnConfig = z.strictObject({
  rpId: z.string().min(1).default('localhost'),
  rpName: z.string().min(1).default('Gatekeeper'),
  origins: z.array(z.url()).default(['http://localhost:8080']),
})

const OAuthProviderConfig = z.strictObject({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  scopes: z.array(z.string().min(1)).default([]),
})

/** A provider that proves identity with a signed blob instead of a redirect dance. */
const SignedPayloadProviderConfig = z.strictObject({
  secret: z.string().min(1),
  maxAgeSeconds: z.number().int().min(60).default(86_400),
})

const MailConfig = z.strictObject({
  smtpUrl: z.string().default(''),
  from: z.string().min(1).default('no-reply@gatekeeper.local'),
})

const S3Config = z.strictObject({
  endpoint: z.url().nullable().default(null),
  region: z.string().min(1).default('us-east-1'),
  accessKeyId: z.string().default(''),
  secretAccessKey: z.string().default(''),
  avatarBucket: z.string().min(1).default('gatekeeper-avatars'),
  publicUrl: z.url().nullable().default(null),
  pathStyle: z.boolean().default(true),
})

const humanVerificationCommon = {
  actions: z.array(HumanVerificationAction).default([]),
  hostnames: z.array(z.string().min(1)).default([]),
  timeoutMs: z.number().int().min(100).max(30_000).default(5_000),
}

const HumanVerificationConfig = z.discriminatedUnion('provider', [
  z.strictObject({ provider: z.literal('disabled'), ...humanVerificationCommon }),
  z.strictObject({
    provider: z.enum(['turnstile', 'hcaptcha', 'recaptcha']),
    ...humanVerificationCommon,
    siteKey: z.string().min(1),
    secret: z.string().min(1),
    minimumScore: z.number().min(0).max(1).default(0.5),
  }),
  z.strictObject({
    provider: z.literal('altcha'),
    ...humanVerificationCommon,
    challengeUrl: z.url(),
    verifyUrl: z.url(),
    secret: z.string().min(1).nullable().default(null),
  }),
])

const GatekeeperYaml = z.strictObject({
  server: ServerConfig.prefault({}),
  database: DatabaseConfig,
  redis: z.strictObject({ url: z.string().min(1).nullable().default(null) }).prefault({}),
  security: SecurityConfig,
  browser: BrowserConfig.prefault({}),
  webauthn: WebAuthnConfig.prefault({}),
  mail: MailConfig.prefault({}),
  oauth: z.record(z.string().min(1), OAuthProviderConfig).prefault({}),
  signedPayload: z.record(z.string().min(1), SignedPayloadProviderConfig).prefault({}),
  s3: S3Config.prefault({}),
  humanVerification: HumanVerificationConfig.prefault({ provider: 'disabled' }),
})

type ParsedConfig = z.infer<typeof GatekeeperYaml>

function configuredPath(args: string[]): string {
  const equalsArgument = args.find((argument) => argument.startsWith('--config='))
  if (equalsArgument) return equalsArgument.slice('--config='.length)

  const flagIndex = args.indexOf('--config')
  if (flagIndex === -1) return DEFAULT_CONFIG_PATH

  const path = args[flagIndex + 1]
  if (!path) throw new Error('--config requires a YAML file path')
  return path
}

function normalizeConfig(parsed: ParsedConfig) {
  if (parsed.humanVerification.provider === 'disabled' && parsed.humanVerification.actions.length) {
    throw new Error('humanVerification.actions requires an enabled provider')
  }

  const issuerOrigin = new URL(parsed.server.issuer).origin
  return {
    port: parsed.server.port,
    issuer: parsed.server.issuer,
    logLevel: parsed.server.logLevel,
    version: parsed.server.version,
    databaseUrl: parsed.database.url,
    databasePoolMax: parsed.database.poolMax,
    redisUrl: parsed.redis.url,
    kek: parsed.security.kek,
    signingKey: parsed.security.signingKey,
    browser: {
      cookieDomain: parsed.browser.cookieDomain,
      allowedRedirectOrigins: parsed.browser.allowedRedirectOrigins ?? [issuerOrigin],
      allowedFormOrigins: parsed.browser.allowedFormOrigins ?? [issuerOrigin],
      corsAllowedOrigins: parsed.browser.corsAllowedOrigins ?? [issuerOrigin],
      trustProxy: parsed.browser.trustProxy,
    },
    webauthn: parsed.webauthn,
    mail: parsed.mail,
    oauth: parsed.oauth,
    signedPayload: parsed.signedPayload,
    s3: parsed.s3,
    humanVerification: parsed.humanVerification,
  } as const
}

export type Config = ReturnType<typeof normalizeConfig>

/** Parses and validates the complete Gatekeeper YAML configuration. */
export function parseConfig(source: string): Config {
  return normalizeConfig(GatekeeperYaml.parse(parseYaml(source)))
}

/** Loads the YAML file selected by `--config`, or `gatekeeper.yaml` by default. */
export function loadConfig(args: string[] = Deno.args): Config {
  const path = configuredPath(args)
  try {
    return parseConfig(Deno.readTextFileSync(path))
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Gatekeeper configuration file not found: ${path}`, { cause: error })
    }
    throw error
  }
}
