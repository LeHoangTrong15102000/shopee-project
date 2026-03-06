import { useState, useEffect, useContext } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useSocket from './useSocket'
import { SocketEvent, CartUpdatedPayload } from 'src/types/socket.types'
import { AppContext } from 'src/contexts/app.context'
import { toast } from 'react-toastify'
import i18n from 'src/i18n/i18n'

interface UseCartSyncReturn {
  lastSyncTimestamp: string | null
  isSyncing: boolean
}

const useCartSync = (): UseCartSyncReturn => {
  const { socket, isConnected } = useSocket()
  const { isAuthenticated } = useContext(AppContext)
  const queryClient = useQueryClient()
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Only activate when authenticated
    if (!socket || !isConnected || !isAuthenticated) return

    const handleCartUpdated = (data: CartUpdatedPayload) => {
      setIsSyncing(true)
      setLastSyncTimestamp(data.timestamp)

      // Invalidate React Query purchases cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['purchases'] })

      // Brief toast notification
      toast.info(i18n.t('sync.updatedFromOtherDevice', { ns: 'cart' }), {
        autoClose: 2000,
        toastId: 'cart-sync' // prevent duplicate toasts
      })

      // Reset syncing state after a brief delay
      setTimeout(() => {
        setIsSyncing(false)
      }, 1000)
    }

    socket.on(SocketEvent.CART_UPDATED, handleCartUpdated)

    return () => {
      socket.off(SocketEvent.CART_UPDATED, handleCartUpdated)
    }
  }, [socket, isConnected, isAuthenticated, queryClient])

  return { lastSyncTimestamp, isSyncing }
}

export default useCartSync
