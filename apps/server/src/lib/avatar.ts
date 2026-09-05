export const MAX_AVATAR_BYTES = 512 * 1024

export interface ImageKind {
  mime: string
  ext: string
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]
const WEBP_SIGNATURE_OFFSET = 8

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  return signature.every((byte, index) => bytes[offset + index] === byte)
}

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (matches(bytes, PNG_SIGNATURE)) return { mime: 'image/png', ext: 'png' }
  if (matches(bytes, JPEG_SIGNATURE)) return { mime: 'image/jpeg', ext: 'jpg' }
  if (matches(bytes, RIFF_SIGNATURE) && matches(bytes, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  return null
}

export function avatarObjectKey(userId: string): string {
  return `${userId}/avatar`
}
