import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import * as z from 'zod'
import { Slug, Uuid } from '../schemas.ts'
import { AdminErrors, AuthErrors, TokenErrors } from '../errors.ts'

const base = oc.meta(openapi({ prefix: '/sso', tags: ['sso'] }))

export const SsoProvider = z.object({
  id: Uuid,
  realmId: Uuid,
  type: z.enum(['saml', 'oidc']),
  name: z.string(),
  enabled: z.boolean(),
  domains: z.array(z.string()),
  createdAt: z.date(),
})

export const discover = base
  .meta(openapi({ method: 'POST', path: '/discover', summary: 'Find the IdP for an email domain' }))
  .errors(AuthErrors)
  .input(z.object({ email: z.email() }))
  .output(
    z.object({
      provider: z.object({ id: Uuid, type: z.enum(['saml', 'oidc']), name: z.string() }).nullable(),
    }),
  )

export const start = base
  .meta(openapi({ method: 'POST', path: '/{providerId}/start' }))
  .errors(AuthErrors)
  .input(z.object({ providerId: Uuid, redirectTo: z.url().optional() }))
  .output(z.object({ redirectUrl: z.url() }))

export const metadata = base
  .meta(openapi({ method: 'GET', path: '/{providerId}/metadata' }))
  .errors(AdminErrors)
  .input(z.object({ providerId: Uuid }))
  .output(
    z.object({
      entityId: z.string(),
      acsUrl: z.url(),
      metadataXml: z.string().nullable(),
    }),
  )

export const create = base
  .meta(openapi({ method: 'POST', path: '/', summary: 'Register an identity provider' }))
  .errors({ ...AdminErrors, ...TokenErrors })
  .input(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('saml'),
        name: z.string(),
        domains: z.array(z.string()).default([]),
        metadataXml: z.string().optional(),
        metadataUrl: z.url().optional(),
        attributeMapping: z.record(z.string(), z.string()).default({}),
      }),
      z.object({
        type: z.literal('oidc'),
        name: z.string(),
        domains: z.array(z.string()).default([]),
        issuer: z.url(),
        clientId: z.string(),
        clientSecret: z.string(),
        scopes: z.array(Slug).default(['openid', 'profile', 'email']),
        claimMapping: z.record(z.string(), z.string()).default({}),
      }),
    ]),
  )
  .output(z.object({ provider: SsoProvider }))

export const list = base
  .meta(openapi({ method: 'GET', path: '/' }))
  .errors({ ...AdminErrors, ...TokenErrors })
  .output(z.object({ items: z.array(SsoProvider) }))

export const remove = base
  .meta(openapi({ method: 'DELETE', path: '/{providerId}' }))
  .errors({ ...AdminErrors, ...TokenErrors })
  .input(z.object({ providerId: Uuid }))
  .output(z.object({ ok: z.literal(true) }))

export const sso = { discover, start, metadata, create, list, remove }
