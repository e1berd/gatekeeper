export const OPAQUE_AUTH_FAILURES = new Set([
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'IDENTITY_NOT_FOUND',
])

export function opaque(code: string): string {
  return OPAQUE_AUTH_FAILURES.has(code) ? 'INVALID_CREDENTIALS' : code
}

/**
 * Runs `work` and never returns before `minimumMs` have elapsed, whether it
 * resolves or throws. Sign-in paths use it so a fast rejection — an address with
 * no account, a locked account — cannot be told apart from a slow one by timing.
 */
export async function notFasterThan<T>(minimumMs: number, work: () => Promise<T>): Promise<T> {
  const startedAt = performance.now()

  try {
    return await work()
  } finally {
    const remaining = minimumMs - (performance.now() - startedAt)
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
  }
}
