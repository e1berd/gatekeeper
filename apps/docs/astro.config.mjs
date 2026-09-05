import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  output: 'static',
  integrations: [
    starlight({
      title: 'Gatekeeper',
      description: 'Self-hosted identity and access management.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com' }],
      sidebar: [
        { label: 'Start', items: [{ label: 'Introduction', link: '/' }] },
        {
          label: 'Concepts',
          items: [
            { label: 'Architecture', slug: 'concepts/architecture' },
            { label: 'Identity and sessions', slug: 'concepts/identity-and-sessions' },
            { label: 'Authorization', slug: 'concepts/authorization' },
            { label: 'Hooks', slug: 'concepts/hooks' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'HTML forms', slug: 'guides/html-forms' },
            { label: 'Resource servers', slug: 'guides/resource-servers' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'REST API', slug: 'reference/rest-api' },
            { label: 'Environment', slug: 'reference/environment' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'Deployment', slug: 'operations/deployment' },
            { label: 'Security', slug: 'operations/security' },
          ],
        },
      ],
    }),
  ],
})
