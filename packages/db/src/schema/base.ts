import { customType, pgSchema, timestamp } from 'drizzle-orm/pg-core'

export const authSchema = pgSchema('auth')
export const rbacSchema = pgSchema('rbac')
export const auditSchema = pgSchema('audit')

export const citext = customType<{ data: string }>({ dataType: () => 'citext' })

export const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
export const now = () => ts('created_at').notNull().defaultNow()
