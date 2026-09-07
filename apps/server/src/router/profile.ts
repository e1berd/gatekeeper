import { ORPCError } from '@orpc/server'
import { sql } from 'drizzle-orm'
import { authed, refuseWhileImpersonating } from '../middleware.ts'
import { todo } from '../lib/todo.ts'
import { loadUser } from '../lib/user.ts'
import { avatarStore } from '../lib/s3.ts'
import { avatarObjectKey, MAX_AVATAR_BYTES, sniffImage } from '../lib/avatar.ts'
import type { AuthenticatedUser, InitialContext } from '../context.ts'

function requireUser(context: { user?: AuthenticatedUser }): AuthenticatedUser {
  if (!context.user) throw new ORPCError('UNAUTHORIZED', { message: 'Missing bearer token' })
  return context.user
}

async function currentUser(context: InitialContext, userId: string) {
  const user = await loadUser(context.db, userId)
  if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' })
  return user
}

const identity = authed.use(refuseWhileImpersonating)

export const profile = {
  get: authed.profile.get.handler(async ({ context }) => {
    const { id } = requireUser(context)
    return { user: await currentUser(context, id) }
  }),

  update: authed.profile.update.handler(async ({ context, input }) => {
    const { id } = requireUser(context)

    if (input.userWritableMetadata) {
      await context.db.execute(sql`
        update auth.users
        set user_metadata = user_metadata || ${JSON.stringify(input.userWritableMetadata)}::jsonb,
            updated_at = now()
        where id = ${id}::uuid
      `)
    }

    return { user: await currentUser(context, id) }
  }),

  uploadAvatar: authed.profile.uploadAvatar.handler(async ({ context, input, errors }) => {
    const { id } = requireUser(context)

    const store = avatarStore()
    if (!store) throw errors.AVATAR_STORAGE_UNAVAILABLE()

    const bytes = new Uint8Array(await input.arrayBuffer())
    if (bytes.byteLength > MAX_AVATAR_BYTES) {
      throw errors.IMAGE_TOO_LARGE({ data: { maxBytes: MAX_AVATAR_BYTES } })
    }

    const kind = sniffImage(bytes)
    if (!kind) throw errors.UNSUPPORTED_IMAGE_TYPE()

    const url = await store.put(avatarObjectKey(id), bytes, kind.mime)
    const versioned = `${url}?v=${Date.now().toString(36)}`

    await context.db.execute(sql`
      update auth.users set avatar_url = ${versioned}, updated_at = now() where id = ${id}::uuid
    `)

    return { user: await currentUser(context, id) }
  }),

  removeAvatar: authed.profile.removeAvatar.handler(async ({ context }) => {
    const { id } = requireUser(context)

    await avatarStore()
      ?.remove(avatarObjectKey(id))
      .catch(() => undefined)
    await context.db.execute(sql`
      update auth.users set avatar_url = null, updated_at = now() where id = ${id}::uuid
    `)

    return { user: await currentUser(context, id) }
  }),

  requestEmailChange: identity.profile.requestEmailChange.handler(
    todo('profile.requestEmailChange'),
  ),
  confirmEmailChange: identity.profile.confirmEmailChange.handler(
    todo('profile.confirmEmailChange'),
  ),
  requestPhoneChange: identity.profile.requestPhoneChange.handler(
    todo('profile.requestPhoneChange'),
  ),
  confirmPhoneChange: identity.profile.confirmPhoneChange.handler(
    todo('profile.confirmPhoneChange'),
  ),
  listIdentities: authed.profile.listIdentities.handler(todo('profile.listIdentities')),
  linkProvider: identity.profile.linkProvider.handler(todo('profile.linkProvider')),
  unlinkProvider: identity.profile.unlinkProvider.handler(todo('profile.unlinkProvider')),
}
