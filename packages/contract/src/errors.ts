import * as z from 'zod'

/**
 * Typed error catalogues shared by the contract, the server and the SDK.
 *
 * The `code` — the object key, such as `INVALID_CREDENTIALS` — is the stable,
 * localizable identifier. Treat it as an i18n message key: a client renders its
 * own copy keyed by `code` and by the procedure it came from, and ignores the
 * `message` string, which is an English developer-facing fallback and is never
 * translated. `data`, where a code defines it, is the structured payload to
 * interpolate into that copy (`retryAfter`, `requiredAal`, `until`) — format it
 * with the viewer's locale, do not read it as prose.
 *
 * How a code reaches the caller depends on the surface:
 *
 * - `/rpc` and `/api` return `{ code, message, data }`; on the SDK client
 *   `isDefinedError(err)` narrows `err.code` to this union and types `err.data`.
 * - `/form` cannot carry a body, so it redirects back with the code lowercased
 *   in `?error=` and drops `data`.
 *
 * Input-shape failures are a separate channel and are not in these catalogues:
 * they surface as Zod issues, identified by `issue.code` plus `issue.path`, and
 * their `message` is likewise not for display. The contract deliberately omits
 * custom Zod messages so there is no English string to leak into a form field.
 *
 * The rendered copy for every code, and the locale-resolution rule for the
 * server-rendered surfaces (emails and `/form/*` pages), live in the
 * "Errors and localization" concept page.
 */

/** Password, OTP and account-state failures across the sign-in and sign-up flows. */
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

/** Refresh-token rotation and session-lifecycle failures. */
export const TokenErrors = {
  INVALID_TOKEN: { message: 'Token is invalid or expired' },
  TOKEN_REUSE_DETECTED: {
    message: 'Refresh token was replayed; every session in the family is revoked',
  },
  SESSION_REVOKED: { message: 'Session has been revoked' },
} as const

/** Second-factor enrolment, challenge and step-up failures. */
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

/** Administrative CRUD failures: authorization, existence and immutability. */
export const AdminErrors = {
  FORBIDDEN: { message: 'Insufficient permissions' },
  NOT_FOUND: { message: 'Resource not found' },
  CONFLICT: { message: 'Resource already exists' },
  IMMUTABLE: { message: 'Resource cannot be modified' },
} as const

/** Self-service profile, avatar and linked-identity failures. */
export const ProfileErrors = {
  EMAIL_TAKEN: { message: 'Email already registered' },
  PHONE_TAKEN: { message: 'Phone number already registered' },
  UNSUPPORTED_IMAGE_TYPE: { message: 'Avatar must be a PNG, JPEG or WebP image' },
  IMAGE_TOO_LARGE: {
    message: 'Avatar exceeds the maximum allowed size',
    data: z.object({ maxBytes: z.number().int() }),
  },
  AVATAR_STORAGE_UNAVAILABLE: {
    message: 'Avatar storage is not configured on this deployment',
  },
  IDENTITY_NOT_FOUND: { message: 'Linked identity not found' },
  CANNOT_UNLINK_SOLE_CREDENTIAL: {
    message: 'Cannot unlink the only remaining way to sign in',
  },
} as const
