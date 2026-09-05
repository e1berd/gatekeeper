import * as z from 'zod'

export const AuthErrors = {
  INVALID_CREDENTIALS: {
    message: 'Invalid credentials',
  },
  USER_NOT_FOUND: {
    message: 'User not found',
  },
  ACCOUNT_LOCKED: {
    message: 'Account is locked',
    data: z.object({ until: z.date().nullable() }),
  },
  EMAIL_NOT_VERIFIED: {
    message: 'Email address is not verified',
  },
  TOO_MANY_REQUESTS: {
    message: 'Rate limit exceeded',
    data: z.object({ retryAfter: z.number().int() }),
  },
} as const

export const TokenErrors = {
  INVALID_TOKEN: { message: 'Token is invalid or expired' },
  TOKEN_REUSE_DETECTED: {
    message: 'Refresh token was replayed; every session in the family is revoked',
  },
  SESSION_REVOKED: { message: 'Session has been revoked' },
} as const

export const MfaErrors = {
  MFA_REQUIRED: { message: 'Multi-factor authentication required' },
  INVALID_MFA_CODE: { message: 'Invalid verification code' },
  FACTOR_NOT_FOUND: { message: 'Factor not found' },
  FACTOR_ALREADY_VERIFIED: { message: 'Factor is already verified' },
  STEP_UP_REQUIRED: {
    message: 'Action requires a higher authenticator assurance level than this session has',
    data: z.object({ requiredAal: z.enum(['aal2', 'aal3']) }),
  },
} as const

export const AdminErrors = {
  FORBIDDEN: { message: 'Insufficient permissions' },
  NOT_FOUND: { message: 'Resource not found' },
  CONFLICT: { message: 'Resource already exists' },
  IMMUTABLE: { message: 'Resource cannot be modified' },
} as const
