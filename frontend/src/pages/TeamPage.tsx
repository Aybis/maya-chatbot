import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type OrgMember } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { UserPlus, Trash, ShieldCheck, UserCircle, Envelope } from '@phosphor-icons/react'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-[#FBF3DB] text-[#956400]',
  admin: 'bg-[#E1F3FE] text-[#1F6C9F]',
  member: 'bg-[#EDF3EC] text-[#346538]',
}

export default function TeamPage() {
  const activeOrgId = useAuthStore((s) => s.activeOrgId)
  const user = useAuthStore((s) => s.user)
  const organizations = useAuthStore((s) => s.organizations)
  const activeOrg = organizations.find((o) => o.id === activeOrgId)
  const qc = useQueryClient()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [inviteMsg, setInviteMsg] = useState('')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', activeOrgId],
    queryFn: () => api.getOrgMembers(activeOrgId!),
    enabled: !!activeOrgId,
  })

  const invite = useMutation({
    mutationFn: () => api.inviteMember(activeOrgId!, email, role),
    onSuccess: () => {
      setEmail('')
      setInviteMsg('Invitation sent.')
      qc.invalidateQueries({ queryKey: ['team', activeOrgId] })
      setTimeout(() => setInviteMsg(''), 3000)
    },
  })

  const remove = useMutation({
    mutationFn: (userId: string) => api.removeMember(activeOrgId!, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', activeOrgId] }),
  })

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateMemberRole(activeOrgId!, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', activeOrgId] }),
  })

  const myRole = members.find((m) => m.user_id === user?.id)?.role || 'member'
  const canManage = myRole === 'owner' || myRole === 'admin'

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="mt-1 text-sm text-muted">
            Manage members and invitations for <span className="font-medium text-ink">{activeOrg?.name || 'your workspace'}</span>
          </p>
        </div>

        {/* Invite */}
        {canManage && (
          <div className="mb-8 rounded-2xl hairline bg-canvas p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">Invite a member</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg hairline bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => email && invite.mutate()}
                disabled={!email || invite.isPending}
                className="flex items-center justify-center gap-2 rounded-[6px] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] disabled:opacity-50"
              >
                <UserPlus size={16} weight="bold" />
                Invite
              </button>
            </div>
            {inviteMsg && <p className="mt-3 text-sm text-[#346538]">{inviteMsg}</p>}
          </div>
        )}

        {/* Members */}
        <div className="rounded-2xl hairline bg-canvas">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold text-ink">Members ({members.length})</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted">Loading members...</div>
          ) : (
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {m.username} {m.user_id === user?.id && <span className="text-muted-2">(you)</span>}
                      </div>
                      <div className="flex items-center gap-1 truncate text-xs text-muted">
                        <Envelope size={12} /> {m.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ROLE_COLORS[m.role] || ROLE_COLORS.member}`}>
                      {m.role}
                    </span>
                    {canManage && m.user_id !== user?.id && (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => changeRole.mutate({ userId: m.user_id, role: e.target.value })}
                          className="rounded-lg hairline bg-canvas px-2 py-1 text-xs text-ink focus:outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          {myRole === 'owner' && <option value="owner">Owner</option>}
                        </select>
                        <button
                          onClick={() => remove.mutate(m.user_id)}
                          className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                          title="Remove member"
                        >
                          <Trash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!canManage && (
          <p className="mt-4 text-center text-sm text-muted">
            Only owners and admins can invite or remove members.
          </p>
        )}
      </div>
    </div>
  )
}