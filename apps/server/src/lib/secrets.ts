import { sql } from 'drizzle-orm'
import { decodeBase64, decodeBase64Url, encodeBase64Url } from '@std/encoding'
import type { Database } from '@gatekeeper/db'

const AES_GCM = 'AES-GCM'
const KEY_BYTES = 32
const IV_BYTES = 12
const SEALED_PART_COUNT = 3
const GLOBAL_SCOPE = 'global'

type Bytes = Uint8Array<ArrayBuffer>

interface SealedParts {
  keyId: string
  iv: Bytes
  ciphertext: Bytes
}

function format({ keyId, iv, ciphertext }: SealedParts): string {
  return `${keyId}.${encodeBase64Url(iv)}.${encodeBase64Url(ciphertext)}`
}

function parse(sealed: string): SealedParts {
  const parts = sealed.split('.')
  if (parts.length !== SEALED_PART_COUNT) throw new Error('Malformed sealed secret')

  const [keyId, iv, ciphertext] = parts as [string, string, string]
  return { keyId, iv: decodeBase64Url(iv), ciphertext: decodeBase64Url(ciphertext) }
}

async function importAesKey(raw: Bytes): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', raw, AES_GCM, false, ['encrypt', 'decrypt'])
}

async function importKek(kek: string): Promise<CryptoKey> {
  const raw = decodeBase64(kek)
  if (raw.byteLength !== KEY_BYTES) {
    throw new Error(`security.kek must decode to ${KEY_BYTES} bytes, got ${raw.byteLength}`)
  }
  return await importAesKey(raw)
}

async function encrypt(key: CryptoKey, plaintext: Bytes): Promise<Omit<SealedParts, 'keyId'>> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt({ name: AES_GCM, iv }, key, plaintext)
  return { iv, ciphertext: new Uint8Array(ciphertext) }
}

async function decrypt(key: CryptoKey, { iv, ciphertext }: SealedParts): Promise<Bytes> {
  const plaintext = await crypto.subtle.decrypt({ name: AES_GCM, iv }, key, ciphertext)
  return new Uint8Array(plaintext)
}

const scopeOf = (realmId: string | null) => realmId ?? GLOBAL_SCOPE

/**
 * Envelope encryption for secrets at rest: TOTP seeds, SSO client secrets, SAML
 * and signing keys. A sealed value carries the id of the data key that produced
 * it, so {@link SecretStore.open} keeps working across rotations and only
 * {@link SecretStore.rotate} decides what new writes are sealed with.
 */
export interface SecretStore {
  seal(realmId: string | null, plaintext: string): Promise<string>
  open(sealed: string): Promise<string>
  /** Issues a fresh data key for the scope and returns its id. Older keys stay readable. */
  rotate(realmId: string | null): Promise<string>
}

/**
 * Builds the store around the master key from `security.kek`. The master key
 * never encrypts a secret directly — it only wraps the data keys in
 * `auth.encryption_keys`, so rotating it rewraps a handful of rows.
 */
export function createSecretStore(db: Database, kek: string): SecretStore {
  const master = importKek(kek)
  const dataKeys = new Map<string, Promise<CryptoKey>>()
  const activeIds = new Map<string, Promise<string>>()

  async function unwrap(wrapped: string): Promise<CryptoKey> {
    return await importAesKey(await decrypt(await master, parse(wrapped)))
  }

  async function wrap(raw: Bytes): Promise<string> {
    const { iv, ciphertext } = await encrypt(await master, raw)
    return format({ keyId: GLOBAL_SCOPE, iv, ciphertext })
  }

  async function create(realmId: string | null): Promise<string> {
    const wrapped = await wrap(crypto.getRandomValues(new Uint8Array(KEY_BYTES)))

    const rows = await db.execute<{ id: string }>(sql`
      with deactivated as (
        update auth.encryption_keys set is_active = false, rotated_at = now()
        where is_active and realm_id is not distinct from ${realmId}::uuid
      )
      insert into auth.encryption_keys (realm_id, wrapped_dek, is_active)
      values (${realmId}::uuid, ${wrapped}, true)
      returning id
    `)

    const created = rows[0]
    if (!created) throw new Error('Failed to create an encryption key')
    return created.id
  }

  async function resolveActiveId(realmId: string | null): Promise<string> {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'dek:' + scopeOf(realmId)}))`)

      const rows = await tx.execute<{ id: string; wrapped_dek: string }>(sql`
        select id, wrapped_dek from auth.encryption_keys
        where is_active and realm_id is not distinct from ${realmId}::uuid
        limit 1
      `)

      const existing = rows[0]
      if (!existing) return await create(realmId)

      dataKeys.set(existing.id, unwrap(existing.wrapped_dek))
      return existing.id
    })
  }

  function activeId(realmId: string | null): Promise<string> {
    const scope = scopeOf(realmId)
    const pending = activeIds.get(scope) ?? resolveActiveId(realmId)
    activeIds.set(scope, pending)
    return pending
  }

  async function loadDataKey(keyId: string): Promise<CryptoKey> {
    const cached = dataKeys.get(keyId)
    if (cached) return await cached

    const rows = await db.execute<{ wrapped_dek: string }>(sql`
      select wrapped_dek from auth.encryption_keys where id = ${keyId}::uuid limit 1
    `)

    const row = rows[0]
    if (!row) throw new Error(`Unknown encryption key: ${keyId}`)

    const key = unwrap(row.wrapped_dek)
    dataKeys.set(keyId, key)
    return await key
  }

  return {
    async seal(realmId, plaintext) {
      const keyId = await activeId(realmId)
      const { iv, ciphertext } = await encrypt(
        await loadDataKey(keyId),
        new TextEncoder().encode(plaintext),
      )
      return format({ keyId, iv, ciphertext })
    },

    async open(sealed) {
      const parts = parse(sealed)
      return new TextDecoder().decode(await decrypt(await loadDataKey(parts.keyId), parts))
    },

    async rotate(realmId) {
      const created = await create(realmId)
      activeIds.set(scopeOf(realmId), Promise.resolve(created))
      return created
    },
  }
}
