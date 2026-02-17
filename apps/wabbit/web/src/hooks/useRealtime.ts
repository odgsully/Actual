import { useEffect, useRef, useLayoutEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface RealtimeOptions {
  debounceMs?: number
}

const MAX_RETRIES = 3

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  filter: string | undefined,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  options?: RealtimeOptions
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')

  // callbackRef pattern — eliminates stale closures for all consumers
  const callbackRef = useRef(callback)
  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const retryCountRef = useRef(0)

  useEffect(() => {
    // Filter guard — don't subscribe to ALL changes when filter is undefined
    if (!filter) {
      setStatus('disconnected')
      return
    }

    let channel: RealtimeChannel | null = null
    let disposed = false

    function subscribe() {
      if (disposed) return

      // Include Date.now() suffix to avoid reuse of cached channel objects
      const channelName = `${table}-${filter}-${Date.now()}`
      setStatus('connecting')

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter },
          (payload: RealtimePostgresChangesPayload<T>) => {
            if (options?.debounceMs) {
              clearTimeout(debounceTimerRef.current)
              debounceTimerRef.current = setTimeout(() => {
                callbackRef.current(payload)
              }, options.debounceMs)
            } else {
              callbackRef.current(payload)
            }
          }
        )
        .subscribe((subscribeStatus) => {
          if (disposed) return

          if (subscribeStatus === 'SUBSCRIBED') {
            setStatus('connected')
            retryCountRef.current = 0
          } else if (
            subscribeStatus === 'CHANNEL_ERROR' ||
            subscribeStatus === 'TIMED_OUT'
          ) {
            setStatus('error')

            // Reconnection with exponential backoff, capped at MAX_RETRIES
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current++
              const delay = 2000 * retryCountRef.current

              if (channel) {
                supabase.removeChannel(channel)
                channel = null
              }

              retryTimerRef.current = setTimeout(() => {
                subscribe()
              }, delay)
            } else {
              setStatus('error')
            }
          }
        })
    }

    subscribe()

    return () => {
      disposed = true
      clearTimeout(debounceTimerRef.current)
      clearTimeout(retryTimerRef.current)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, options?.debounceMs])

  return status
}
