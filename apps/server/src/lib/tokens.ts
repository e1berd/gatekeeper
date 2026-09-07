import { importJWK, jwtVerify, SignJWT } from 'jose'
import type { JWTPayload, JWTVerifyResult, KeyObject } from 'jose'
import { encodeBase64Url, encodeHex } from '@std/encoding'
import type { Aal } from '@gatekeeper/contract'
import type { SigningKeys } from './keys.ts'

const OPAQUE_TOKEN_BYTES = 32
const SHA_256 = 'SHA-256'

/**
 * The claims every Gatekeeper access token carries, alongside the standard
 * `iss`, `aud`, `exp`, `nbf` and `iat`. `pv` is the user's permissions version:
 * a resource server that caches a decision must discard it when `pv` moves.
 * `act` names the original actor while a session is impersonated.
 */
export interface AccessTokenClaims {
  sub: string
  sid: string
  realm: string
  aal: Aal
  amr: string[]
  org: string | null
  roles: string[]
  pv: number
  act: string | null
}

export interface AccessTokenRequest extends AccessTokenClaims {
  realmId: string
  audience: string | string[]
  ttlSeconds: number
}

export interface IssuedAccessToken {
  token: string
  expiresIn: number
}

/** An opaque refresh or one-time token: `token` is handed out, `hash` is stored. */
export interface OpaqueToken {
  token: string
  hash: string
}

async function digestOf(value: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest(SHA_256, new TextEncoder().encode(value)))
}

export async function sha256Hex(value: string): Promise<string> {
  return encodeHex(await digestOf(value))
}

/** The PKCE `S256` transformation: base64url of the verifier's SHA-256 digest. */
export async function sha256Base64Url(value: string): Promise<string> {
  return encodeBase64Url(await digestOf(value))
}

/**
 * Mints a 256-bit opaque token. Only the returned `hash` may be persisted —
 * a stolen database must not yield usable refresh tokens.
 */
export async function createOpaqueToken(): Promise<OpaqueToken> {
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(OPAQUE_TOKEN_BYTES)))
  return { token, hash: await sha256Hex(token) }
}

/** Constant-time comparison for equal-length digests. Length itself is not secret. */
export function timingSafeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

export interface TokenService {
  issueAccessToken(request: AccessTokenRequest): Promise<IssuedAccessToken>
  /**
   * Verifies signature, issuer, audience and expiry against the published JWKS.
   * Throws — it never returns an unverified payload — so callers map the failure
   * onto their own error surface.
   */
  verifyAccessToken(token: string, audience: string): Promise<AccessTokenClaims & JWTPayload>
}

export function createTokenService(keys: SigningKeys, issuer: string): TokenService {
  const imported = new Map<string, Promise<CryptoKey | KeyObject | Uint8Array>>()

  async function importByKid(kid: string, algorithm: string) {
    const published = await keys.publicJwks()
    const jwk = published.find((candidate) => candidate.kid === kid)
    if (!jwk) throw new Error(`Unknown signing key: ${kid}`)

    return await importJWK(jwk, algorithm)
  }

  function resolveKey(header: { kid?: string; alg: string }) {
    if (!header.kid) throw new Error('Access token has no kid')

    const pending = imported.get(header.kid) ?? importByKid(header.kid, header.alg)
    imported.set(header.kid, pending)
    return pending
  }

  return {
    async issueAccessToken(request) {
      const { realmId, audience, ttlSeconds, ...claims } = request
      const key = await keys.active(realmId)
      const issuedAt = Math.floor(Date.now() / 1000)

      const token = await new SignJWT({ ...claims })
        .setProtectedHeader({ alg: key.algorithm, kid: key.kid, typ: 'at+jwt' })
        .setIssuer(issuer)
        .setAudience(audience)
        .setSubject(claims.sub)
        .setIssuedAt(issuedAt)
        .setNotBefore(issuedAt)
        .setExpirationTime(issuedAt + ttlSeconds)
        .sign(key.privateKey)

      return { token, expiresIn: ttlSeconds }
    },

    async verifyAccessToken(token, audience) {
      const { payload }: JWTVerifyResult = await jwtVerify(token, resolveKey, {
        issuer,
        audience,
      })

      return payload as AccessTokenClaims & JWTPayload
    },
  }
}
