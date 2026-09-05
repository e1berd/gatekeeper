import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { contract } from '@gatekeeper/contract'
import { config } from './config.ts'

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
})

const spec = await generator.generate(contract, {
  base: {
    info: {
      title: 'Gatekeeper',
      version: config.version,
      description: 'Self-hosted identity and access management.',
    },
    servers: [{ url: `${config.issuer}/api` }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
})

console.log(JSON.stringify(spec, null, 2))
