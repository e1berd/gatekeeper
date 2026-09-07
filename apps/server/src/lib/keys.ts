import { sql } from 'drizzle-orm'
import { calculateJwkThumbprint, exportJWK, generateKeyPair, importJWK } from 'jose'
import type { JWK } from 'jose'
import { decodeBase64 } from '@std/encoding'
import type { Database } from '@gatekeeper/db'
import type { SecretStore } from './secrets.ts'

const SIGNING_ALGORITHMS = ['ES256', 'EdDSA'] as const

export type SigningAlgorithm = (typeof SIGNING_ALGORITHMS)[number]

/**
 * ES256 is the default because every mainstream JWT library verifies P-256,
 * while OKP support outside JavaScript is uneven and a resource server that
 * cannot parse the JWKS cannot integrate at all.
 */
export const DEFAULT_SIGNING_ALGORITHM: SigningAlgorithm = 'ES256'

const PUBLIC_KEYS_CACHE_TTL_MS = 30_000

type Executor = Pick<Database, 'execute'>

export interface ActiveSigningKey {
  kid: string
  algorithm: SigningAlgorithm
  privateKey: CryptoKey
}

type SigningKeyRow = {
  kid: string
  algorithm: string
  private_key_encrypted: string
}

function isSigningAlgorithm(value: string): value is SigningAlgorithm {
  return (SIGNING_ALGORITHMS as readonly string[]).includes(value)
}

function algorithmOf(jwk: JWK): SigningAlgorithm {
  if (jwk.alg && isSigningAlgorithm(jwk.alg)) return jwk.alg
  if (jwk.kty === 'EC' && jwk.crv === 'P-256') return 'ES256'
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') return 'EdDSA'
  throw new Error(`Unsupported signing key: kty=${jwk.kty} crv=${jwk.crv}`)
}

function parseConfiguredKey(configured: string): JWK {
  const looksLikeJson = configured.trimStart().startsWith('{')
  const json = looksLikeJson ? configured : new TextDecoder().decode(decodeBase64(configured))

  return JSON.parse(json) as JWK
}

async function toPrivateKey(jwk: JWK, algorithm: SigningAlgorithm): Promise<CryptoKey> {
  const key = await importJWK(jwk, algorithm)
  if (!(key instanceof CryptoKey)) throw new Error('Signing key must be asymmetric')
  return key
}

async function readActive(executor: Executor, realmId: string): Promise<SigningKeyRow | undefined> {
  const rows = await executor.execute<SigningKeyRow>(sql`
    select kid, algorithm, private_key_encrypted from auth.signing_keys
    where is_active and realm_id = ${realmId}::uuid
    limit 1
  `)

  return rows[0]
}

/**
 * The realm's signing keys. Only one key per realm signs at a time; every
 * unexpired public key stays in {@link SigningKeys.publicJwks} so a token minted
 * before a rotation still verifies.
 */
export interface SigningKeys {
  active(realmId: string): Promise<ActiveSigningKey>
  publicJwks(): Promise<JWK[]>
  /** Retires the current key without unpublishing it, and returns the new `kid`. */
  rotate(realmId: string, algorithm?: SigningAlgorithm): Promise<string>
  /**
   * Gives every realm an active key. Called at boot so the JWKS is populated
   * before the first token is issued — a resource server that fetches an empty
   * key set at startup may cache it.
   */
  bootstrap(): Promise<void>
}

export function createSigningKeys(
  db: Database,
  secrets: SecretStore,
  configuredKey: string | null = null,
): SigningKeys {
  const active = new Map<string, Promise<ActiveSigningKey>>()
  let publicKeys: { value: Promise<JWK[]>; expiresAt: number } | null = null

  async function store(
    executor: Executor,
    realmId: string,
    jwk: JWK,
    algorithm: SigningAlgorithm,
  ): Promise<void> {
    const { d: _privateComponent, ...publicJwk } = jwk
    const kid = await calculateJwkThumbprint(publicJwk)
    const sealed = await secrets.seal(realmId, JSON.stringify(jwk))
    const published = JSON.stringify({ ...publicJwk, kid, alg: algorithm, use: 'sig' })

    await executor.execute(sql`
      with deactivated as (
        update auth.signing_keys set is_active = false, rotated_at = now()
        where is_active and realm_id = ${realmId}::uuid
      )
      insert into auth.signing_keys
        (realm_id, kid, algorithm, public_jwk, private_key_encrypted, is_active)
      values (
        ${realmId}::uuid, ${kid}, ${algorithm}, ${published}::jsonb, ${sealed}, true
      )
      on conflict (kid) do update set is_active = true
    `)

    publicKeys = null
  }

  async function provision(executor: Executor, realmId: string): Promise<void> {
    if (configuredKey) {
      const jwk = parseConfiguredKey(configuredKey)
      return await store(executor, realmId, jwk, algorithmOf(jwk))
    }

    const { privateKey } = await generateKeyPair(DEFAULT_SIGNING_ALGORITHM, { extractable: true })
    await store(executor, realmId, await exportJWK(privateKey), DEFAULT_SIGNING_ALGORITHM)
  }

  async function loadActive(realmId: string): Promise<ActiveSigningKey> {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'signing:' + realmId}))`)

      let stored = await readActive(tx, realmId)

      if (!stored) {
        await provision(tx, realmId)
        stored = await readActive(tx, realmId)
      }

      if (!stored) throw new Error(`No signing key for realm ${realmId}`)

      const algorithm = isSigningAlgorithm(stored.algorithm)
        ? stored.algorithm
        : DEFAULT_SIGNING_ALGORITHM
      const jwk = JSON.parse(await secrets.open(stored.private_key_encrypted)) as JWK

      return { kid: stored.kid, algorithm, privateKey: await toPrivateKey(jwk, algorithm) }
    })
  }

  async function readPublicJwks(): Promise<JWK[]> {
    const rows = await db.execute<{ public_jwk: JWK }>(sql`
      select public_jwk from auth.signing_keys
      where expires_at is null or expires_at > now()
      order by is_active desc, created_at desc
    `)

    return rows.map((row) => row.public_jwk)
  }

  function activeKey(realmId: string): Promise<ActiveSigningKey> {
    const pending = active.get(realmId) ?? loadActive(realmId)
    active.set(realmId, pending)
    return pending
  }

  return {
    active: activeKey,

    publicJwks() {
      if (publicKeys && publicKeys.expiresAt > Date.now()) return publicKeys.value
      publicKeys = { value: readPublicJwks(), expiresAt: Date.now() + PUBLIC_KEYS_CACHE_TTL_MS }
      return publicKeys.value
    },

    async bootstrap() {
      const realms = await db.execute<{ id: string }>(sql`select id from auth.realms`)
      await Promise.all(realms.map((realm) => activeKey(realm.id)))
    },

    async rotate(realmId, algorithm = DEFAULT_SIGNING_ALGORITHM) {
      const { privateKey } = await generateKeyPair(algorithm, { extractable: true })
      await store(db, realmId, await exportJWK(privateKey), algorithm)
      active.delete(realmId)

      const stored = await readActive(db, realmId)
      if (!stored) throw new Error(`Rotation produced no active key for realm ${realmId}`)
      return stored.kid
    },
  }
}
