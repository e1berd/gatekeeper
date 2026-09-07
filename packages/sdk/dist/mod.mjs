import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
//#region src/storage.ts
const COOKIE_RETENTION_MILLISECONDS = 3456e7;
/**
* Browser storage backed by the asynchronous Cookie Store API.
*
* Cookies are scoped to the current origin, use `SameSite=Strict`, and are
* available to JavaScript. Use the `/form/*` flow when tokens must be HttpOnly.
*
* @param prefix Namespace for the cookie names, so several clients can coexist.
* @param store Cookie Store for the current window or service worker.
*/
function cookieStoreAdapter(prefix = "gatekeeper", store = globalThis.cookieStore) {
	const name = (key) => `${prefix}:${key}`;
	return {
		get: async (key) => (await store.get(name(key)))?.value ?? null,
		set: async (key, value) => await store.set({
			name: name(key),
			value,
			expires: Date.now() + COOKIE_RETENTION_MILLISECONDS,
			path: "/",
			sameSite: "strict"
		}),
		remove: async (key) => await store.delete({
			name: name(key),
			path: "/"
		})
	};
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
function localStorageAdapter(prefix = "gatekeeper") {
	return {
		get: (key) => globalThis.localStorage?.getItem(`${prefix}:${key}`) ?? null,
		set: (key, value) => globalThis.localStorage?.setItem(`${prefix}:${key}`, value),
		remove: (key) => globalThis.localStorage?.removeItem(`${prefix}:${key}`)
	};
}
/**
* Storage that lives only as long as the object.
*
* The default outside browsers, and the right choice on a server, where one
* instance per request keeps sessions from leaking between users.
*/
function memoryStorage() {
	const entries = /* @__PURE__ */ new Map();
	return {
		get: (key) => entries.get(key) ?? null,
		set: (key, value) => void entries.set(key, value),
		remove: (key) => void entries.delete(key)
	};
}
//#endregion
//#region src/mod.ts
const ACCESS = "access_token";
const ACCESS_EXP = "access_token_exp";
const REFRESH = "refresh_token";
const MASTER_REALM = "master";
function defaultStorage() {
	if (typeof globalThis.cookieStore !== "undefined") return cookieStoreAdapter();
	if (typeof globalThis.localStorage !== "undefined") return localStorageAdapter();
	return memoryStorage();
}
/** A browser or server-side client for one Gatekeeper deployment and realm. */
var Gatekeeper = class extends EventTarget {
	auth;
	sso;
	health;
	humanVerification;
	org;
	authz;
	hooks;
	admin;
	#client;
	#storage;
	#skew;
	#refreshing = null;
	#refreshClient;
	constructor(url, options = {}) {
		super();
		this.#storage = options.storage ?? defaultStorage();
		this.#skew = options.refreshSkew ?? 30;
		const origin = url.toString().replace(/\/+$/, "");
		const staticHeaders = () => {
			const headers = { "x-gatekeeper-realm": options.realm ?? MASTER_REALM };
			if (options.language) headers["accept-language"] = options.language;
			return headers;
		};
		const link = new RPCLink({
			origin,
			url: "/rpc",
			headers: async () => {
				const headers = staticHeaders();
				const token = await this.#currentAccessToken();
				if (token) headers.authorization = `Bearer ${token}`;
				return headers;
			}
		});
		this.#client = createORPCClient(link);
		this.#refreshClient = createORPCClient(new RPCLink({
			origin,
			url: "/rpc",
			headers: staticHeaders
		}));
		this.auth = {
			signUp: async (input) => await this.#persistAuthentication(await this.#client.auth.signUp(input)),
			signIn: async (input) => await this.#persistAuthentication(await this.#client.auth.signInPassword(input)),
			requestOtp: this.#client.auth.signInOtp,
			verifyOtp: async (input) => await this.#persistAuthentication(await this.#client.auth.verifyOtp(input)),
			verifySignedPayload: async (input) => await this.#persistAuthentication(await this.#client.auth.verifySignedPayload(input)),
			verifyPasskey: async (input) => await this.#persistAuthentication(await this.#client.passkey.authenticateVerify(input)),
			complete: async (result) => await this.#persistAuthentication(result),
			getSession: this.#client.auth.getSession,
			getMe: this.#client.profile.get,
			verifyEmail: async (input) => await this.#persistAuthentication(await this.#client.auth.verifyEmail(input)),
			requestPasswordReset: this.#client.auth.requestPasswordReset,
			resetPassword: this.#client.auth.resetPassword,
			changePassword: this.#client.auth.changePassword,
			signOut: async (scope = "local") => await this.#signOut(scope),
			switchOrg: async (orgId) => {
				const result = await this.#client.auth.switchOrg({ orgId });
				await this.#persist(result);
				return result;
			},
			getAccessToken: async () => await this.#currentAccessToken(),
			isAuthenticated: async () => await this.#currentAccessToken() !== null,
			oauth: {
				start: this.#client.auth.oauthStart,
				exchange: async (input) => await this.#persistAuthentication(await this.#client.auth.oauthExchange(input))
			},
			sessions: {
				list: this.#client.auth.listSessions,
				revoke: this.#client.auth.revokeSession
			},
			profile: this.#client.profile,
			passkeys: {
				registerOptions: this.#client.passkey.registerOptions,
				registerVerify: this.#client.passkey.registerVerify,
				authenticateOptions: this.#client.passkey.authenticateOptions,
				authenticateVerify: async (input) => await this.#persistAuthentication(await this.#client.passkey.authenticateVerify(input)),
				list: this.#client.passkey.list,
				rename: this.#client.passkey.rename,
				remove: this.#client.passkey.remove
			},
			mfa: {
				enrollTotp: this.#client.mfa.enrollTotp,
				verifyTotpEnrolment: this.#client.mfa.verifyTotpEnrolment,
				verifyChallenge: async (input) => await this.#persistAuthentication(await this.#client.mfa.verifyChallenge(input)),
				stepUp: async (input) => {
					const result = await this.#client.mfa.stepUp(input);
					await this.#persist(result);
					return result;
				},
				listFactors: this.#client.mfa.listFactors,
				removeFactor: this.#client.mfa.removeFactor,
				regenerateRecoveryCodes: this.#client.mfa.regenerateRecoveryCodes
			}
		};
		this.sso = {
			discover: this.#client.sso.discover,
			start: this.#client.sso.start,
			providers: {
				create: this.#client.sso.create,
				list: this.#client.sso.list,
				remove: this.#client.sso.remove,
				metadata: this.#client.sso.metadata
			}
		};
		this.health = this.#client.health;
		this.humanVerification = this.#client.humanVerification;
		this.org = this.#client.org;
		this.authz = this.#client.authz;
		this.hooks = this.#client.hooks;
		this.admin = this.#client.admin;
	}
	async #currentAccessToken() {
		const token = await this.#storage.get(ACCESS);
		const expRaw = await this.#storage.get(ACCESS_EXP);
		const exp = expRaw ? Number(expRaw) : 0;
		if (token && exp - this.#skew > Date.now() / 1e3) return token;
		if (!await this.#storage.get(REFRESH)) return null;
		this.#refreshing ??= this.#refresh().finally(() => {
			this.#refreshing = null;
		});
		return await this.#refreshing;
	}
	async #persist(tokens) {
		await this.#storage.set(ACCESS, tokens.accessToken);
		await this.#storage.set(ACCESS_EXP, String(Math.floor(Date.now() / 1e3) + tokens.expiresIn));
		if (tokens.refreshToken) await this.#storage.set(REFRESH, tokens.refreshToken);
	}
	async #persistAuthentication(result) {
		if (result.status === "authenticated") await this.#persist(result.tokens);
		return result;
	}
	async #clear() {
		await this.#storage.remove(ACCESS);
		await this.#storage.remove(ACCESS_EXP);
		await this.#storage.remove(REFRESH);
	}
	async #refresh() {
		const refreshToken = await this.#storage.get(REFRESH);
		if (!refreshToken) return null;
		try {
			const tokens = await this.#refreshClient.auth.refresh({ refreshToken });
			await this.#persist(tokens);
			return tokens.accessToken;
		} catch {
			await this.#clear();
			this.dispatchEvent(new Event("signout"));
			return null;
		}
	}
	async #signOut(scope) {
		try {
			await this.#client.auth.signOut({ scope });
		} finally {
			await this.#clear();
			this.dispatchEvent(new Event("signout"));
		}
	}
};
/** Creates a {@link Gatekeeper} using the pre-0.2 options-object API. */
function createGatekeeper(options) {
	const client = new Gatekeeper(options.url, options);
	if (options.onSignOut) client.addEventListener("signout", options.onSignOut);
	return client;
}
//#endregion
export { Gatekeeper, cookieStoreAdapter, createGatekeeper, localStorageAdapter, memoryStorage };
