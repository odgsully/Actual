import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CollaboratorRole } from '@/types/app'

export function useCollaboratorRole(collectionId: string | undefined) {
  const { user } = useAuth()
  const [role, setRole] = useState<CollaboratorRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!collectionId || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('collaborators')
      .select('role')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setRole((data?.role as CollaboratorRole) ?? null)
        setLoading(false)
      })
  }, [collectionId, user])

  return {
    role,
    loading,
    isOwner: role === 'owner',
    canRank: role === 'owner' || role === 'contributor',
  }
}
