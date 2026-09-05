import { S3Client } from '@bradenmacdonald/s3-lite-client'
import { config } from '../config.ts'

export interface AvatarStore {
  put(key: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<string>
  remove(key: string): Promise<void>
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

let resolved: AvatarStore | null | undefined

/**
 * The avatar object store, or `null` when `S3_ENDPOINT` is unset.
 *
 * Any S3-compatible service works — the bundled RustFS, MinIO, AWS S3, R2. When
 * this returns `null` the avatar procedures reject with `AVATAR_STORAGE_UNAVAILABLE`
 * rather than failing at the network layer.
 */
export function avatarStore(): AvatarStore | null {
  if (resolved !== undefined) return resolved

  const { s3 } = config
  if (!s3.endpoint) {
    resolved = null
    return resolved
  }

  const client = new S3Client({
    endPoint: s3.endpoint,
    region: s3.region,
    bucket: s3.avatarBucket,
    accessKey: s3.accessKeyId,
    secretKey: s3.secretAccessKey,
    pathStyle: s3.pathStyle,
  })

  const publicBase = trimTrailingSlash(
    s3.publicUrl ?? `${trimTrailingSlash(s3.endpoint)}/${s3.avatarBucket}`,
  )

  resolved = {
    async put(key, bytes, contentType) {
      await client.putObject(key, bytes, {
        metadata: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'x-amz-acl': 'public-read',
        },
      })
      return `${publicBase}/${key}`
    },
    async remove(key) {
      await client.deleteObject(key)
    },
  }
  return resolved
}
