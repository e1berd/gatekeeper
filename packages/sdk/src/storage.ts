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

const COOKIE_RETENTION_MILLISECONDS = 400 * 24 * 60 * 60 * 1000

/**
 * Browser storage backed by the asynchronous Cookie Store API.
 *
 * Cookies are scoped to the current origin, use `SameSite=Strict`, and are
 * available to JavaScript. Use the `/form/*` flow when tokens must be HttpOnly.
 *
 * @param prefix Namespace for the cookie names, so several clients can coexist.
 * @param store Cookie Store for the current window or service worker.
 */
export function cookieStoreAdapter(
  prefix = 'gatekeeper',
  store: CookieStore = globalThis.cookieStore,
): TokenStorage {
  const name = (key: string) => `${prefix}:${key}`

  return {
    get: async (key) => (await store.get(name(key)))?.value ?? null,
    set: async (key, value) =>
      await store.set({
        name: name(key),
        value,
        expires: Date.now() + COOKIE_RETENTION_MILLISECONDS,
        path: '/',
        sameSite: 'strict',
      }),
    remove: async (key) => await store.delete({ name: name(key), path: '/' }),
  }
}

/**
 * Browser storage that survives a page reload, scoped to one origin.
 *
 * Used as a fallback when the Cookie Store API is unavailable. Tokens are
 * readable by any script on the origin, so prefer the cookie-based `/form/*`
 * flow when that matters.
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
