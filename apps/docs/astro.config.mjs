import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  output: 'static',
  site: Deno.env.get('GATEKEEPER_DOCS_URL') ?? 'https://docs.gatekeeper.dev',
  integrations: [
    starlight({
      title: { en: 'Gatekeeper', ru: 'Gatekeeper' },
      description: 'Self-hosted identity and access management.',
      locales: {
        root: { label: 'English', lang: 'en' },
        ru: { label: 'Русский', lang: 'ru' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com' }],
      sidebar: [
        { label: 'Start', items: [{ label: 'Introduction', link: '/' }] },
        {
          label: 'Concepts',
          items: [
            { label: 'Architecture', slug: 'concepts/architecture' },
            { label: 'Identity and sessions', slug: 'concepts/identity-and-sessions' },
            { label: 'Authorization', slug: 'concepts/authorization' },
            { label: 'Permissions and entitlements', slug: 'concepts/entitlements' },
            { label: 'Hooks', slug: 'concepts/hooks' },
            { label: 'Errors and localization', slug: 'concepts/errors' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Password authentication', slug: 'guides/password-authentication' },
            { label: 'Passkeys', slug: 'guides/passkeys' },
            { label: 'TOTP and recovery codes', slug: 'guides/totp-and-recovery-codes' },
            { label: 'Social login', slug: 'guides/social-login' },
            {
              label: 'Organizations and invitations',
              slug: 'guides/organizations-and-invitations',
            },
            { label: 'Workspace on sign-up', slug: 'guides/workspace-on-sign-up' },
            { label: 'HTML forms', slug: 'guides/html-forms' },
            { label: 'SQL hooks', slug: 'guides/sql-hooks' },
            { label: 'HTTP hooks', slug: 'guides/http-hooks' },
            { label: 'Resource servers', slug: 'guides/resource-servers' },
            { label: 'Laravel', slug: 'guides/resource-servers/laravel' },
            { label: 'Express and Fastify', slug: 'guides/resource-servers/node' },
            { label: 'Django', slug: 'guides/resource-servers/django' },
            { label: 'Spring', slug: 'guides/resource-servers/spring' },
            { label: 'ASP.NET', slug: 'guides/resource-servers/aspnet' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'REST API', slug: 'reference/rest-api' },
            { label: 'SDK', slug: 'reference/sdk' },
            { label: 'Environment', slug: 'reference/environment' },
            { label: 'Database schema', slug: 'reference/database-schema' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'Deployment', slug: 'operations/deployment' },
            { label: 'Key rotation', slug: 'operations/key-rotation' },
            { label: 'Backup and restore', slug: 'operations/backup-and-restore' },
            { label: 'Upgrades', slug: 'operations/upgrades' },
            { label: 'Security', slug: 'operations/security' },
          ],
        },
      ],
    }),
  ],
})
