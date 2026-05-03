import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrderTracking } from '@/apis/tracking.api'
import { useChatStore, getSocket } from '@/store/chatStore'
import { TrackingUpdate } from '@/types/tracking.type'

const POLLING_INTERVAL = 10000

export function useOrderTracking(orderId: string) {
  const socketStatus = useChatStore((state) => state.status)
  const [liveTracking, setLiveTracking] = useState<TrackingUpdate | null>(null)
  const roomJoinedRef = useRef(false)

  // Use polling as fallback when socket is not connected
  const isSocketConnected = socketStatus === 'connected'

  const query = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    refetchInterval: isSocketConnected ? false : POLLING_INTERVAL,
    enabled: !!orderId,
  })

  // Subscribe to WebSocket tracking:update events
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !isSocketConnected) return

    if (!roomJoinedRef.current) {
      socket.emit('tracking:join', { orderId })
      roomJoinedRef.current = true
    }

    const handleUpdate = (update: TrackingUpdate) => {
      if (update.orderId === orderId) {
        setLiveTracking(update)
      }
    }

    socket.on('tracking:update', handleUpdate)

    return () => {
      socket.off('tracking:update', handleUpdate)
      socket.emit('tracking:leave', { orderId })
      roomJoinedRef.current = false
    }
  }, [socketStatus, orderId])

  // Merge: live socket data takes precedence over polled data
  const tracking = liveTracking ?? query.data ?? null

  return {
    tracking,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
