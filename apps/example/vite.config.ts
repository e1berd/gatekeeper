import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const packagePath = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/mod.ts`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@gatekeeper/sdk': packagePath('sdk'),
      '@gatekeeper/contract': packagePath('contract'),
    },
  },
})
