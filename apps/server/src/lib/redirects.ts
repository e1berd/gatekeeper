/**
 * Resolves a caller-supplied redirect target against an allowlist, falling back
 * when it does not match. An identity provider that follows an unchecked
 * `redirect_to` is an open redirect, and a phishing page one hop from a real
 * login.
 */
export function toAllowedRedirect(
  candidate: string | null | undefined,
  allowedOrigins: readonly string[],
  fallback: string,
): string {
  if (!candidate) return fallback

  try {
    const target = new URL(candidate, fallback)
    const allowed = allowedOrigins.some((origin) => target.origin === new URL(origin).origin)

    return allowed ? target.toString() : fallback
  } catch {
    return fallback
  }
}
