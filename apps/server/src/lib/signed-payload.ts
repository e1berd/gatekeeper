import type { AuthResult } from '@gatekeeper/contract'

import { type FlowEnv, mfaChallenge, reject } from './flows.ts'
import { resolveUser } from './identities.ts'
import { openSession } from './password-auth.ts'
import { findSignedPayloadProvider } from './signed-payload-providers.ts'

export interface SignedPayloadCredentials {
  secret: string
  maxAgeSeconds: number
}

export interface SignedPayloadInput {
  provider: string
  payload: string
}

/**
 * Verifies a provider-signed payload and signs the account in, creating or
 * linking the identity behind it. A provider with no entry under
 * `signedPayload` is refused, so enabling one is a configuration change.
 */
export async function verifySignedPayload(
  env: FlowEnv,
  providers: Record<string, SignedPayloadCredentials>,
  input: SignedPayloadInput,
): Promise<AuthResult> {
  const provider = findSignedPayloadProvider(input.provider)
  const credentials = providers[input.provider]

  if (!provider || !credentials) {
    return reject({ code: 'PROVIDER_NOT_CONFIGURED', provider: input.provider })
  }

  const verified = await provider.verify(
    input.payload,
    credentials.secret,
    credentials.maxAgeSeconds,
  )

  if (!verified.ok) return reject({ code: 'INVALID_TOKEN' })

  const db = env.session.db
  const userId = await resolveUser(db, env.session.realmId, provider.slug, verified.profile)

  return (
    (await mfaChallenge(db, userId)) ?? {
      status: 'authenticated',
      tokens: await openSession(env, userId, [provider.slug]),
    }
  )
}
