/**
 * Where the SDK keeps tokens between calls.
 *
 * Implement this to control persistence — a cookie jar during SSR, secure
 * storage on mobile, or an encrypted store. Every method may be synchronous or
 * return a promise.
 */
export interface TokenStorage {
  get(key: string): string | null | Promise<string | null>
  set(key: string, value: string): void | Promise<void>
  remove(key: string): void | Promise<void>
}

/**
 * Browser storage that survives a page reload, scoped to one origin.
 *
 * Chosen automatically in browsers. Tokens are readable by any script on the
 * origin, so prefer the cookie-based `/form/*` flow when that matters.
 *
 * @param prefix Namespace for the keys, so several clients can coexist.
 */
export function localStorageAdapter(prefix = 'gatekeeper'): TokenStorage {
  return {
    get: (key) => globalThis.localStorage?.getItem(`${prefix}:${key}`) ?? null,
    set: (key, value) => globalThis.localStorage?.setItem(`${prefix}:${key}`, value),
    remove: (key) => globalThis.localStorage?.removeItem(`${prefix}:${key}`),
  }
}

/**
 * Storage that lives only as long as the object.
 *
 * The default outside browsers, and the right choice on a server, where one
 * instance per request keeps sessions from leaking between users.
 */
export function memoryStorage(): TokenStorage {
  const entries = new Map<string, string>()

  return {
    get: (key) => entries.get(key) ?? null,
    set: (key, value) => void entries.set(key, value),
    remove: (key) => void entries.delete(key),
  }
}
