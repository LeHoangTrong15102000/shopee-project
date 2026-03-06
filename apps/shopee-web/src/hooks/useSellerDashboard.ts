import { useState, useEffect, useContext } from 'react'
import useSocket from './useSocket'
import {
  SocketEvent,
  SellerOrderNotificationPayload,
  SellerMetricsUpdatePayload,
  SellerQANotificationPayload
} from 'src/types/socket.types'
import { AppContext } from 'src/contexts/app.context'

interface UseSellerDashboardReturn {
  orderNotifications: SellerOrderNotificationPayload[]
  metrics: SellerMetricsUpdatePayload
  qaNotifications: SellerQANotificationPayload[]
  isActive: boolean
}

const DEFAULT_METRICS: SellerMetricsUpdatePayload = {
  today_orders: 0,
  today_revenue: 0,
  pending_orders: 0,
  pending_qa: 0
}

const useSellerDashboard = (): UseSellerDashboardReturn => {
  const { socket, isConnected } = useSocket()
  const { profile } = useContext(AppContext)
  const [orderNotifications, setOrderNotifications] = useState<SellerOrderNotificationPayload[]>([])
  const [metrics, setMetrics] = useState<SellerMetricsUpdatePayload>(DEFAULT_METRICS)
  const [qaNotifications, setQANotifications] = useState<SellerQANotificationPayload[]>([])

  // Check if user is Admin
  const isAdmin = profile?.roles?.includes('Admin') ?? false

  useEffect(() => {
    if (!socket || !isConnected || !isAdmin) return

    // Subscribe to seller dashboard
    socket.emit(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD)

    const handleOrderNotification = (data: SellerOrderNotificationPayload) => {
      setOrderNotifications((prev) => [data, ...prev].slice(0, 50))
    }

    const handleMetricsUpdate = (data: SellerMetricsUpdatePayload) => {
      setMetrics(data)
    }

    const handleQANotification = (data: SellerQANotificationPayload) => {
      setQANotifications((prev) => [data, ...prev].slice(0, 50))
    }

    socket.on(SocketEvent.SELLER_ORDER_NOTIFICATION, handleOrderNotification)
    socket.on(SocketEvent.SELLER_METRICS_UPDATE, handleMetricsUpdate)
    socket.on(SocketEvent.SELLER_QA_NOTIFICATION, handleQANotification)

    return () => {
      socket.emit(SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD)
      socket.off(SocketEvent.SELLER_ORDER_NOTIFICATION, handleOrderNotification)
      socket.off(SocketEvent.SELLER_METRICS_UPDATE, handleMetricsUpdate)
      socket.off(SocketEvent.SELLER_QA_NOTIFICATION, handleQANotification)
      setOrderNotifications([])
      setMetrics(DEFAULT_METRICS)
      setQANotifications([])
    }
  }, [socket, isConnected, isAdmin])

  return { orderNotifications, metrics, qaNotifications, isActive: isAdmin }
}

export default useSellerDashboard
