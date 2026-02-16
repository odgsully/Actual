import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { inviteByEmail, removeCollaborator, acceptInvite } from '@/lib/api/collaborators'
import { useAuth } from '@/hooks/useAuth'
import type { CollaboratorRole } from '@/types/app'

interface Collaborator {
  id: string
  user_id: string
  role: string
  accepted_at: string | null
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  collectionId: string
  collaborators: Collaborator[]
  onRefresh: () => void
}

const ROLE_OPTIONS = [
  { value: 'contributor', label: 'Contributor' },
  { value: 'viewer', label: 'Viewer' },
]

const ROLE_BADGES: Record<string, string> = {
  owner: 'bg-yellow-500/20 text-yellow-400',
  contributor: 'bg-blue-500/20 text-blue-400',
  viewer: 'bg-white/10 text-white/50',
}

export function TeamTab({ collectionId, collaborators, onRefresh }: Props) {
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('contributor')
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError(null)

    const { error: err } = await inviteByEmail(collectionId, inviteEmail.trim(), inviteRole)
    if (err) {
      setError(typeof err === 'string' ? err : err.message)
    } else {
      setInviteEmail('')
      onRefresh()
    }
    setInviting(false)
  }

  async function handleAccept(collaboratorId: string) {
    setAccepting(collaboratorId)
    await acceptInvite(collaboratorId)
    onRefresh()
    setAccepting(null)
  }

  async function handleRemove(collaboratorId: string) {
    setRemoving(collaboratorId)
    await removeCollaborator(collaboratorId)
    onRefresh()
    setRemoving(null)
  }

  return (
    <div className="space-y-5">
      {/* Collaborator list */}
      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <p className="text-white/30 text-sm">No collaborators yet.</p>
        ) : (
          collaborators.map((c) => {
            const name = c.profiles?.display_name ?? c.user_id.slice(0, 8)
            const avatar = c.profiles?.avatar_url
            const badgeClass = ROLE_BADGES[c.role] ?? ROLE_BADGES.viewer
            const isPending = c.role !== 'owner' && !c.accepted_at
            const isCurrentUser = user?.id === c.user_id

            return (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-sm text-white/80 flex-1 truncate">{name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {c.role}
                </span>
                {isPending && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                    Pending
                  </span>
                )}
                {isPending && isCurrentUser && (
                  <button
                    onClick={() => handleAccept(c.id)}
                    disabled={accepting === c.id}
                    className="text-green-400 hover:text-green-300 transition-colors duration-700 text-xs"
                  >
                    {accepting === c.id ? '...' : 'Accept'}
                  </button>
                )}
                {c.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(c.id)}
                    disabled={removing === c.id}
                    className="text-white/30 hover:text-red-400 transition-colors duration-700 text-xs"
                  >
                    {removing === c.id ? '...' : 'Remove'}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Invite form */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <p className="text-sm text-white/60">Invite collaborator</p>
        <Input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Email address"
          type="email"
        />
        <Select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
          options={ROLE_OPTIONS}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button
          variant="primary"
          onClick={handleInvite}
          disabled={inviting || !inviteEmail.trim()}
          className="w-full"
        >
          {inviting ? 'Inviting...' : 'Invite'}
        </Button>
      </div>
    </div>
  )
}
