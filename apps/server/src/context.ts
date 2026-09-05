import type { Database } from '@gatekeeper/db'
import type { Aal, RealmSettings } from '@gatekeeper/contract'

export interface InitialContext {
  db: Database
  headers: Headers
  ip: string | null
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
