import { useEffect, useState } from 'react'
import { socketClient } from 'src/lib/socket'
import { useAuthStore } from 'src/stores/auth.store'
import http, { getRefreshTokenFromLS, URL_REFRESH_TOKEN } from 'src/utils/http'

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

    // Register the token refresher so the socket can self-heal using the same
    // refresh-access-token flow that the REST layer uses.
    socketClient.setTokenRefresher(async () => {
      try {
        const refreshToken = getRefreshTokenFromLS()
        if (!refreshToken) return null
        const res = await http.post<{ data: { access_token: string } }>(URL_REFRESH_TOKEN, {
          refresh_token: refreshToken,
        })
        const newToken = res.data.data.access_token
        useAuthStore.getState().setTokens(newToken)
        return newToken
      } catch {
        useAuthStore.getState().logout()
        return null
      }
    })

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
