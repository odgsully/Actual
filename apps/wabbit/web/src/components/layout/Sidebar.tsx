import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { FolderTree } from '@/components/sidebar/FolderTree'
import { NewWabbButton } from '@/components/sidebar/NewWabbButton'
import { NewWabbForm } from '@/components/wabb/NewWabbForm'
import { useNavigate } from 'react-router-dom'

export function Sidebar() {
  const { user, signOut } = useAuth()
  const [showNewWabb, setShowNewWabb] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()

  return (
    <>
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-4">
          <span className="text-xl font-bold">Wabbit</span>
        </div>

        {/* Folder tree with search/filters */}
        <div className="flex-1 overflow-y-auto">
          <FolderTree refreshKey={refreshKey} />
        </div>

        {/* New Wabb button */}
        <div className="mt-4">
          <NewWabbButton onClick={() => setShowNewWabb(true)} />
        </div>

        {/* User section */}
        {user && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </p>
              </div>
              <button
                onClick={signOut}
                className="text-white/40 hover:text-white/80 transition-colors duration-700 text-xs"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Wabb modal */}
      {showNewWabb && (
        <NewWabbForm
          onClose={() => setShowNewWabb(false)}
          onCreated={(id) => {
            setShowNewWabb(false)
            setRefreshKey((k) => k + 1)
            navigate(`/wabb/${id}`)
          }}
        />
      )}
    </>
  )
}
