import { defineConfig } from 'tsdown'

/**
 * The contract is bundled in rather than referenced: a consumer installing the SDK
 * straight from git would otherwise have to resolve a second package out of the same
 * repository, and the contract is definitions only, so inlining it costs nothing.
 */
export default defineConfig({
  entry: ['src/mod.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  deps: {
    alwaysBundle: ['@gatekeeper/contract'],
    neverBundle: ['@orpc/client', '@orpc/contract', '@orpc/openapi', 'zod'],
  },
  alias: {
    '@gatekeeper/contract': new URL('../contract/src/mod.ts', import.meta.url).pathname,
  },
})
