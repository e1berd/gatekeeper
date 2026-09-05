import { authed, pub } from '../middleware.ts'
import { todo } from '../lib/todo.ts'

export const org = {
  listMine: authed.org.listMine.handler(todo('org.listMine')),
  create: authed.org.create.handler(todo('org.create')),
  get: authed.org.get.handler(todo('org.get')),
  update: authed.org.update.handler(todo('org.update')),
  remove: authed.org.remove.handler(todo('org.remove')),
  listMembers: authed.org.listMembers.handler(todo('org.listMembers')),
  setMemberRole: authed.org.setMemberRole.handler(todo('org.setMemberRole')),
  removeMember: authed.org.removeMember.handler(todo('org.removeMember')),
  leave: authed.org.leave.handler(todo('org.leave')),
  transferOwnership: authed.org.transferOwnership.handler(todo('org.transferOwnership')),
  invite: authed.org.invite.handler(todo('org.invite')),
  listInvitations: authed.org.listInvitations.handler(todo('org.listInvitations')),
  revokeInvitation: authed.org.revokeInvitation.handler(todo('org.revokeInvitation')),
  acceptInvitation: pub.org.acceptInvitation.handler(todo('org.acceptInvitation')),
}
