import { useEffect, useState } from 'react'
import { useAuthStore } from 'src/stores/auth.store'
import { socketClient } from 'src/lib/socket'

export type SocketStatus = 'connected' | 'reconnecting' | 'disconnected'

/**
 * Manages the socket connection lifecycle.
 * Connects when authenticated, disconnects on logout or unmount.
 * Returns the current connection status.
 */
export function useSocket(): SocketStatus {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [status, setStatus] = useState<SocketStatus>(() => socketClient.status)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketClient.disconnect()
      setStatus('disconnected')
      return
    }

    socketClient.connect(accessToken)
    setStatus(socketClient.status)

    const unsubscribe = socketClient.onStatusChange((newStatus) => {
      setStatus(newStatus)
    })

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated, accessToken])

  // Disconnect on layout unmount
  useEffect(() => {
    return () => {
      socketClient.disconnect()
    }
  }, [])

  return status
}
