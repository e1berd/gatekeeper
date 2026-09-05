import * as z from 'zod'

export const Slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/, 'must be lowercase alphanumeric with . _ -')

export const Uuid = z.uuid()
export const Email = z.email().max(320)

export const Aal = z.enum(['aal1', 'aal2', 'aal3'])
export type Aal = z.infer<typeof Aal>

export const UserStatus = z.enum(['active', 'pending', 'locked', 'disabled'])
export const FactorType = z.enum(['totp', 'webauthn', 'recovery_code'])
export const ScopeType = z.enum(['global', 'org', 'resource'])

export const Scope = z.object({
  type: ScopeType,
  id: z.string().max(255).nullable().default(null),
})
export type Scope = z.infer<typeof Scope>

export const KeysetCursor = z.string()

export const Realm = z.object({
  id: Uuid,
  slug: Slug,
  name: z.string(),
  createdAt: z.date(),
})

export const User = z.object({
  id: Uuid,
  realmId: Uuid,
  email: Email.nullable(),
  emailVerified: z.boolean(),
  phone: z.string().max(32).nullable(),
  phoneVerified: z.boolean(),
  status: UserStatus,
  userWritableMetadata: z.record(z.string(), z.unknown()),
  serverOnlyMetadata: z.record(z.string(), z.unknown()),
  hasPassword: z.boolean(),
  mfaEnabled: z.boolean(),
  lastSignInAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type User = z.infer<typeof User>

export const Identity = z.object({
  id: Uuid,
  userId: Uuid,
  provider: z.string(),
  providerUserId: z.string(),
  email: Email.nullable(),
  lastSignInAt: z.date().nullable(),
  createdAt: z.date(),
})

export const AuthenticationMethodReference = z.string()

export const Session = z.object({
  id: Uuid,
  userId: Uuid,
  aal: Aal,
  amr: z.array(AuthenticationMethodReference),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
  refreshedAt: z.date(),
  notAfter: z.date().nullable(),
})

export const TokenPair = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int(),
  refreshToken: z.string(),
  session: Session,
  user: User,
})

export const AuthResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('authenticated'), tokens: TokenPair }),
  z.object({
    status: z.literal('mfa_required'),
    challengeToken: z.string(),
    factors: z.array(z.object({ id: Uuid, type: FactorType, name: z.string().nullable() })),
  }),
  z.object({ status: z.literal('verification_required'), reason: z.enum(['email', 'phone']) }),
])

export const Role = z.object({
  id: Uuid,
  realmId: Uuid,
  key: Slug,
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: z.date(),
})

export const Permission = z.object({
  id: Uuid,
  realmId: Uuid,
  resource: Slug,
  action: Slug,
  description: z.string().nullable(),
})

export const RoleAssignment = z.object({
  roleId: Uuid,
  roleKey: Slug,
  scope: Scope,
  expiresAt: z.date().nullable(),
  grantedBy: Uuid.nullable(),
  grantedAt: z.date(),
})

export const Paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    nextCursor: KeysetCursor.nullable(),
  })

export const PageInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  cursor: KeysetCursor.nullable().default(null),
})
