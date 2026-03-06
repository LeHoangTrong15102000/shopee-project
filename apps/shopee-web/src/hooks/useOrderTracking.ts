import { useState, useEffect } from 'react'
import useSocket from './useSocket'
import { SocketEvent, OrderStatusUpdatedPayload } from 'src/types/socket.types'
import { toast } from 'react-toastify'
import i18n from 'src/i18n/i18n'

interface OrderStatusHistoryEntry {
  status: string
  updated_at: string
  message?: string
}

interface UseOrderTrackingReturn {
  currentStatus: string | null
  lastUpdate: string | null
  statusHistory: OrderStatusHistoryEntry[]
  isSubscribed: boolean
}

const STATUS_I18N_KEYS: Record<string, string> = {
  pending: 'tracking.statusPending',
  confirmed: 'tracking.statusConfirmed',
  processing: 'tracking.statusProcessing',
  shipping: 'tracking.statusShipping',
  delivered: 'tracking.statusDelivered',
  cancelled: 'tracking.statusCancelled',
  returned: 'tracking.statusReturned'
}

const getStatusMessage = (status: string): string =>
  STATUS_I18N_KEYS[status]
    ? (i18n.t(`order:${STATUS_I18N_KEYS[status]}` as never) as unknown as string)
    : (i18n.t('order:tracking.statusFallback' as never, { status } as never) as unknown as string)

const useOrderTracking = (orderId: string | undefined): UseOrderTrackingReturn => {
  const { socket, isConnected } = useSocket()
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistoryEntry[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!socket || !isConnected || !orderId) return

    // Subscribe to order room
    socket.emit(SocketEvent.SUBSCRIBE_ORDER, { order_id: orderId })
    setIsSubscribed(true)

    // Handle order status updates
    const handleOrderStatusUpdate = (data: OrderStatusUpdatedPayload) => {
      if (data.order_id === orderId) {
        setCurrentStatus(data.new_status)
        setLastUpdate(data.updated_at)
        setStatusHistory((prev) => [
          ...prev,
          {
            status: data.new_status,
            updated_at: data.updated_at,
            message: data.message
          }
        ])

        // Show toast with translated message
        const statusMsg = getStatusMessage(data.new_status)
        if (data.new_status === 'cancelled' || data.new_status === 'returned') {
          toast.warning(statusMsg, { autoClose: 5000 })
        } else if (data.new_status === 'delivered') {
          toast.success(`🎉 ${statusMsg}`, { autoClose: 5000 })
        } else {
          toast.info(statusMsg, { autoClose: 4000 })
        }
      }
    }

    socket.on(SocketEvent.ORDER_STATUS_UPDATED, handleOrderStatusUpdate)

    return () => {
      // Cleanup: unsubscribe and remove listener
      socket.emit(SocketEvent.UNSUBSCRIBE_ORDER, { order_id: orderId })
      socket.off(SocketEvent.ORDER_STATUS_UPDATED, handleOrderStatusUpdate)
      setIsSubscribed(false)
    }
  }, [socket, isConnected, orderId])

  return { currentStatus, lastUpdate, statusHistory, isSubscribed }
}

export default useOrderTracking
