export const OPAQUE_AUTH_FAILURES = new Set([
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'IDENTITY_NOT_FOUND',
])

export function opaque(code: string): string {
  return OPAQUE_AUTH_FAILURES.has(code) ? 'INVALID_CREDENTIALS' : code
}
