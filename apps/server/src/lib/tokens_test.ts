import { assert, assertEquals, assertFalse, assertRejects } from '@std/assert'
import { calculateJwkThumbprint, exportJWK, generateKeyPair } from 'jose'
import type { JWK } from 'jose'
import type { ActiveSigningKey, SigningAlgorithm, SigningKeys } from './keys.ts'
import {
  type AccessTokenRequest,
  createOpaqueToken,
  createTokenService,
  sha256Base64Url,
  sha256Hex,
  timingSafeEquals,
} from './tokens.ts'

const ISSUER = 'https://id.example.com'
const AUDIENCE = 'https://api.example.com'

async function stubSigningKeys(algorithm: SigningAlgorithm = 'ES256'): Promise<SigningKeys> {
  const { privateKey, publicKey } = await generateKeyPair(algorithm, { extractable: true })
  const publicJwk = await exportJWK(publicKey)
  const kid = await calculateJwkThumbprint(publicJwk)
  const active: ActiveSigningKey = { kid, algorithm, privateKey }
  const published: JWK[] = [{ ...publicJwk, kid, alg: algorithm, use: 'sig' }]

  return {
    active: () => Promise.resolve(active),
    publicJwks: () => Promise.resolve(published),
    rotate: () => Promise.resolve(kid),
    bootstrap: () => Promise.resolve(),
  }
}

function request(overrides: Partial<AccessTokenRequest> = {}): AccessTokenRequest {
  return {
    realmId: '00000000-0000-0000-0000-000000000001',
    audience: AUDIENCE,
    ttlSeconds: 900,
    sub: '00000000-0000-0000-0000-0000000000aa',
    sid: '00000000-0000-0000-0000-0000000000bb',
    realm: 'master',
    aal: 'aal1',
    amr: ['pwd'],
    org: null,
    roles: ['member'],
    pv: 3,
    act: null,
    ...overrides,
  }
}

Deno.test('an access token round-trips every Gatekeeper claim', async () => {
  const tokens = createTokenService(await stubSigningKeys(), ISSUER)

  const { token, expiresIn } = await tokens.issueAccessToken(request())
  const claims = await tokens.verifyAccessToken(token, AUDIENCE)

  assertEquals(expiresIn, 900)
  assertEquals(claims.sub, '00000000-0000-0000-0000-0000000000aa')
  assertEquals(claims.sid, '00000000-0000-0000-0000-0000000000bb')
  assertEquals(claims.realm, 'master')
  assertEquals(claims.aal, 'aal1')
  assertEquals(claims.amr, ['pwd'])
  assertEquals(claims.org, null)
  assertEquals(claims.roles, ['member'])
  assertEquals(claims.pv, 3)
  assertEquals(claims.act, null)
  assertEquals(claims.iss, ISSUER)
  assertEquals(claims.aud, AUDIENCE)
  assert(typeof claims.exp === 'number' && typeof claims.nbf === 'number')
})

Deno.test('EdDSA keys are honoured when a realm opts into them', async () => {
  const tokens = createTokenService(await stubSigningKeys('EdDSA'), ISSUER)

  const { token } = await tokens.issueAccessToken(request())
  assertEquals((await tokens.verifyAccessToken(token, AUDIENCE)).realm, 'master')
})

Deno.test('a token minted for one resource server does not verify against another', async () => {
  const tokens = createTokenService(await stubSigningKeys(), ISSUER)

  const { token } = await tokens.issueAccessToken(request())
  await assertRejects(() => tokens.verifyAccessToken(token, 'https://other.example.com'))
})

Deno.test('a token from another issuer is rejected', async () => {
  const keys = await stubSigningKeys()
  const foreign = createTokenService(keys, 'https://evil.example.com')
  const ours = createTokenService(keys, ISSUER)

  const { token } = await foreign.issueAccessToken(request())
  await assertRejects(() => ours.verifyAccessToken(token, AUDIENCE))
})

Deno.test('a token signed by an unpublished key is rejected', async () => {
  const foreign = createTokenService(await stubSigningKeys(), ISSUER)
  const ours = createTokenService(await stubSigningKeys(), ISSUER)

  const { token } = await foreign.issueAccessToken(request())
  await assertRejects(() => ours.verifyAccessToken(token, AUDIENCE))
})

Deno.test('an expired token is rejected', async () => {
  const tokens = createTokenService(await stubSigningKeys(), ISSUER)

  const { token } = await tokens.issueAccessToken(request({ ttlSeconds: -60 }))
  await assertRejects(() => tokens.verifyAccessToken(token, AUDIENCE))
})

Deno.test('opaque tokens are unique and stored only as their digest', async () => {
  const first = await createOpaqueToken()
  const second = await createOpaqueToken()

  assert(first.token !== second.token)
  assertFalse(first.hash.includes(first.token))
  assertEquals(first.hash, await sha256Hex(first.token))
  assertEquals(first.hash.length, 64)
})

Deno.test('timingSafeEquals matches only identical values', () => {
  assert(timingSafeEquals('a1b2c3', 'a1b2c3'))
  assertFalse(timingSafeEquals('a1b2c3', 'a1b2c4'))
  assertFalse(timingSafeEquals('a1b2c3', 'a1b2c'))
})

Deno.test('sha256Base64Url matches the PKCE S256 vector from RFC 7636', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

  assertEquals(await sha256Base64Url(verifier), challenge)
})

Deno.test('an opaque token is a usable PKCE verifier length', async () => {
  const { token } = await createOpaqueToken()

  assert(token.length >= 43 && token.length <= 128)
})
