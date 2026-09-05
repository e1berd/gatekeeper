import { hash as argon2Hash, parseOptions, verify as argon2Verify } from '@node-rs/argon2'
import type { Algorithm, Options, Version } from '@node-rs/argon2'
import type { PasswordPolicy } from '@gatekeeper/contract'

const ARGON2ID: Algorithm = 2
const ARGON2_VERSION_19: Version = 1

/**
 * Argon2id cost parameters, named the way the PHC hash string encodes them:
 * `memoryKib` is `m=`, `timeCost` is `t=`, `parallelism` is `p=`.
 */
export interface Argon2idParams {
  memoryKib: number
  timeCost: number
  parallelism: number
}

/**
 * OWASP-recommended Argon2id parameters: a 19456 KiB memory pool, two passes,
 * no extra parallelism. Used whenever a realm supplies no {@link PasswordPolicy}.
 */
export const OWASP_ARGON2ID_PARAMS: Argon2idParams = {
  memoryKib: 19_456,
  timeCost: 2,
  parallelism: 1,
}

/** Read the Argon2id cost parameters out of a realm's {@link PasswordPolicy}. */
export function argon2idParamsFromPolicy(policy: PasswordPolicy): Argon2idParams {
  return {
    memoryKib: policy.argon2MemoryKib,
    timeCost: policy.argon2TimeCost,
    parallelism: policy.argon2Parallelism,
  }
}

function hashOptions(params: Argon2idParams): Options {
  return {
    algorithm: ARGON2ID,
    version: ARGON2_VERSION_19,
    memoryCost: params.memoryKib,
    timeCost: params.timeCost,
    parallelism: params.parallelism,
  }
}

/**
 * Hash a plaintext password with Argon2id and a fresh 16-byte random salt. The
 * result is a self-describing PHC string (`$argon2id$v=19$m=…,t=…,p=…$salt$digest`)
 * that is safe to store verbatim and carries everything {@link verifyPassword}
 * and {@link needsRehash} later need.
 */
export function hashPassword(
  password: string,
  params: Argon2idParams = OWASP_ARGON2ID_PARAMS,
): Promise<string> {
  return argon2Hash(password, hashOptions(params))
}

/**
 * Check a plaintext password against a stored Argon2id PHC string. Returns
 * `false` — never throws — when the password is wrong or the stored hash is
 * malformed or not Argon2. The digest comparison inside Argon2id is constant-time.
 */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await argon2Verify(storedHash, password)
  } catch {
    return false
  }
}

function isBelowStrength(current: Argon2idParams, target: Argon2idParams): boolean {
  return (
    current.memoryKib < target.memoryKib ||
    current.timeCost < target.timeCost ||
    current.parallelism < target.parallelism
  )
}

function safeParse(storedHash: string): ReturnType<typeof parseOptions> | null {
  try {
    return parseOptions(storedHash)
  } catch {
    return null
  }
}

/**
 * Whether a just-verified password's stored hash should be replaced with a fresh
 * one. True when the hash is not Argon2id, predates Argon2 v19, or was computed
 * with weaker cost parameters than `target`. A hash already at or above `target`
 * strength is left alone, so lowering a realm's policy never downgrades existing
 * hashes. Only meaningful once {@link verifyPassword} has returned `true`.
 */
export function needsRehash(
  storedHash: string,
  target: Argon2idParams = OWASP_ARGON2ID_PARAMS,
): boolean {
  const parsed = safeParse(storedHash)
  if (!parsed) return true
  if (parsed.algorithm !== ARGON2ID) return true
  if (parsed.version !== ARGON2_VERSION_19) return true

  return isBelowStrength(
    {
      memoryKib: parsed.memoryCost,
      timeCost: parsed.timeCost,
      parallelism: parsed.parallelism,
    },
    target,
  )
}

/** The result of {@link checkPassword}. `rehash` is always `false` when `valid` is. */
export interface PasswordCheck {
  valid: boolean
  rehash: boolean
}

/**
 * Verify a password and, in one call, report whether its stored hash has fallen
 * below `target` strength and should be re-hashed after a successful login —
 * the shape a password sign-in handler needs.
 */
export async function checkPassword(
  storedHash: string,
  password: string,
  target: Argon2idParams = OWASP_ARGON2ID_PARAMS,
): Promise<PasswordCheck> {
  const valid = await verifyPassword(storedHash, password)
  return { valid, rehash: valid && needsRehash(storedHash, target) }
}
