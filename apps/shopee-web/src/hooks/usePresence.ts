import { useState, useEffect } from 'react'
import useSocket from './useSocket'
import { SocketEvent, PresenceStatusPayload, PresenceUpdatePayload } from 'src/types/socket.types'

interface UsePresenceReturn {
  status: 'online' | 'offline'
  lastSeen: string | null
  isOnline: boolean
}

const usePresence = (userId: string | undefined): UsePresenceReturn => {
  const { socket, isConnected } = useSocket()
  const [status, setStatus] = useState<'online' | 'offline'>('offline')
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    if (!socket || !isConnected || !userId) return

    // Request initial presence status
    socket.emit(SocketEvent.GET_PRESENCE, { user_id: userId })

    // Handle presence status response
    const handlePresenceStatus = (data: PresenceStatusPayload) => {
      if (data.user_id === userId) {
        setStatus(data.status)
        setLastSeen(data.last_seen ?? null)
      }
    }

    // Handle real-time presence updates
    const handlePresenceUpdate = (data: PresenceUpdatePayload) => {
      if (data.user_id === userId) {
        setStatus(data.status)
        setLastSeen(data.last_seen ?? null)
      }
    }

    socket.on(SocketEvent.PRESENCE_STATUS, handlePresenceStatus)
    socket.on(SocketEvent.PRESENCE_UPDATE, handlePresenceUpdate)

    return () => {
      socket.off(SocketEvent.PRESENCE_STATUS, handlePresenceStatus)
      socket.off(SocketEvent.PRESENCE_UPDATE, handlePresenceUpdate)
    }
  }, [socket, isConnected, userId])

  return {
    status,
    lastSeen,
    isOnline: status === 'online'
  }
}

export default usePresence
