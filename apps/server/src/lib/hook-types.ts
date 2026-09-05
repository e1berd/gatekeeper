export const HOOK_EVENTS = [
  'before_sign_up',
  'after_sign_up',
  'before_sign_in',
  'after_sign_in',
  'before_token_issue',
  'before_org_create',
  'after_org_create',
  'after_invite_accepted',
  'before_password_change',
] as const

export type HookEvent = (typeof HOOK_EVENTS)[number]

const BLOCKING_EVENTS = new Set<HookEvent>([
  'before_sign_up',
  'before_sign_in',
  'before_token_issue',
  'before_org_create',
  'before_password_change',
])

export function isBlockingEvent(event: HookEvent): boolean {
  return BLOCKING_EVENTS.has(event)
}

export interface HookOutcome {
  decision: 'allow' | 'deny'
  code: string | null
  message: string | null
  claims: Record<string, unknown>
  patch: Record<string, unknown>
}

export const ALLOW: HookOutcome = {
  decision: 'allow',
  code: null,
  message: null,
  claims: {},
  patch: {},
}

export function mergeOutcomes(left: HookOutcome, right: HookOutcome): HookOutcome {
  if (right.decision === 'deny') return right
  if (left.decision === 'deny') return left

  return {
    decision: 'allow',
    code: null,
    message: null,
    claims: { ...left.claims, ...right.claims },
    patch: { ...left.patch, ...right.patch },
  }
}

export function parseOutcome(raw: unknown): HookOutcome {
  if (raw === null || typeof raw !== 'object') return ALLOW

  const value = raw as Record<string, unknown>
  const denied = value.decision === 'deny'

  return {
    decision: denied ? 'deny' : 'allow',
    code: typeof value.code === 'string' ? value.code : null,
    message: typeof value.message === 'string' ? value.message : null,
    claims: isRecord(value.claims) ? value.claims : {},
    patch: isRecord(value.patch) ? value.patch : {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
