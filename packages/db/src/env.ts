const REFERENCE = /\$\{([A-Z_][A-Z0-9_]*)(?::-([^}]*))?\}/g

type Env = { get(key: string): string | undefined }

/**
 * Expands `${VAR}` and `${VAR:-default}` references in a config file against the
 * process environment. A reference with no value and no default throws, so a
 * missing secret fails at load time instead of as a confusing connection error.
 */
export function expandEnv(source: string, env: Env = Deno.env): string {
  return source.replaceAll(REFERENCE, (_match, name: string, fallback: string | undefined) => {
    const value = env.get(name) ?? fallback
    if (value === undefined) {
      throw new Error(`config references ${name}, which is not set and has no default`)
    }
    return value
  })
}
