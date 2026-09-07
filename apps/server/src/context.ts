import type { Database } from '@gatekeeper/db'
import type { Aal, RealmSettings } from '@gatekeeper/contract'
import type { HumanVerificationService } from './lib/human-verification.ts'
import type { SecretStore } from './lib/secrets.ts'
import type { SigningKeys } from './lib/keys.ts'
import type { TokenService } from './lib/tokens.ts'
import type { KeyValueStore } from './lib/store.ts'
import type { Mailer } from './lib/mail.ts'

export interface InitialContext {
  db: Database
  headers: Headers
  ip: string | null
  humanVerification: HumanVerificationService
  secrets: SecretStore
  signingKeys: SigningKeys
  tokens: TokenService
  store: KeyValueStore
  mailer: Mailer
}

export interface AuthenticatedUser {
  id: string
  realmId: string
  sessionId: string
  aal: Aal
  activeOrgId: string | null
  roles: string[]
  permissionsVersion: number
  impersonatorId: string | null
}

export interface RealmContext {
  realmId: string
  realmSlug: string
  settings: RealmSettings
}
