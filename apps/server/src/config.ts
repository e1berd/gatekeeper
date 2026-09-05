function required(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function int(name: string, fallback: number): number {
  const raw = Deno.env.get(name)
  return raw ? Number.parseInt(raw, 10) : fallback
}

function list(name: string, fallback: string[] = []): string[] {
  const raw = Deno.env.get(name)
  return raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback
}

export const config = {
  port: int('GATEKEEPER_PORT', 8080),
  issuer: Deno.env.get('GATEKEEPER_ISSUER') ?? 'http://localhost:8080',
  logLevel: Deno.env.get('LOG_LEVEL') ?? 'info',

  databaseUrl: required('DATABASE_URL'),
  databasePoolMax: int('DATABASE_POOL_MAX', 10),
  redisUrl: Deno.env.get('REDIS_URL') || null,

  kek: required('GATEKEEPER_KEK'),
  signingKey: Deno.env.get('GATEKEEPER_SIGNING_KEY') || null,

  webauthn: {
    rpId: Deno.env.get('WEBAUTHN_RP_ID') ?? 'localhost',
    rpName: Deno.env.get('WEBAUTHN_RP_NAME') ?? 'Gatekeeper',
    origins: list('WEBAUTHN_ORIGINS', ['http://localhost:8080']),
  },

  mail: {
    smtpUrl: Deno.env.get('SMTP_URL') ?? '',
    from: Deno.env.get('MAIL_FROM') ?? 'no-reply@gatekeeper.local',
  },

  version: Deno.env.get('GATEKEEPER_VERSION') ?? '0.1.0',
} as const

export type Config = typeof config
