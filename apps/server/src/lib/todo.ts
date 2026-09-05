import { ORPCError } from '@orpc/server'

export function todo(name: string): () => never {
  return () => {
    throw new ORPCError('NOT_IMPLEMENTED', { message: `${name} is not implemented yet` })
  }
}
