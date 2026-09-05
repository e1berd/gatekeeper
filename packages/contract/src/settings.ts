import * as z from 'zod'
import { FactorType } from './schemas.ts'

export const PasswordPolicy = z.object({
  minLength: z.number().int().min(8).max(256).default(12),
  requireBreachCheck: z.boolean().default(false),
  argon2MemoryKib: z.number().int().min(19_456).default(19_456),
  argon2TimeCost: z.number().int().min(2).default(2),
  argon2Parallelism: z.number().int().min(1).default(1),
})

export const TokenPolicy = z.object({
  accessTokenTtl: z.number().int().min(60).max(3600).default(900),
  refreshTokenTtl: z.number().int().min(3600).default(2_592_000),
  sessionIdleTimeout: z.number().int().min(300).default(1_209_600),
  sessionAbsoluteTimeout: z.number().int().min(3600).nullable().default(null),
})

export const LockoutPolicy = z.object({
  maxFailedAttempts: z.number().int().min(3).default(10),
  baseBackoffSeconds: z.number().int().min(1).default(2),
  maxBackoffSeconds: z.number().int().min(60).default(3600),
})

export const SignUpPolicy = z.object({
  enabled: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  allowedEmailDomains: z.array(z.string()).default([]),
})

export const MfaPolicy = z.object({
  requirement: z.enum(['off', 'optional', 'required']).default('optional'),
  allowedFactors: z.array(FactorType).default(['totp', 'webauthn', 'recovery_code']),
  requireForAdmins: z.boolean().default(true),
})

export const RealmSettings = z.object({
  password: PasswordPolicy.prefault({}),
  tokens: TokenPolicy.prefault({}),
  lockout: LockoutPolicy.prefault({}),
  signUp: SignUpPolicy.prefault({}),
  mfa: MfaPolicy.prefault({}),
})

export type PasswordPolicy = z.infer<typeof PasswordPolicy>
export type TokenPolicy = z.infer<typeof TokenPolicy>
export type LockoutPolicy = z.infer<typeof LockoutPolicy>
export type MfaPolicy = z.infer<typeof MfaPolicy>
export type RealmSettings = z.infer<typeof RealmSettings>

export const DEFAULT_REALM_SETTINGS: RealmSettings = RealmSettings.parse({})
