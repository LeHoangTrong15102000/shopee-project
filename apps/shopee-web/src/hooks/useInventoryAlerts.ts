import { useState, useEffect, useCallback, useContext } from 'react'
import useSocket from './useSocket'
import { SocketEvent, InventoryAlertPayload } from 'src/types/socket.types'
import { toast } from 'react-toastify'
import { AppContext } from 'src/contexts/app.context'

interface UseInventoryAlertsReturn {
  alerts: InventoryAlertPayload[]
  unreadCount: number
  clearAlerts: () => void
}

const useInventoryAlerts = (): UseInventoryAlertsReturn => {
  const { socket, isConnected } = useSocket()
  const { profile } = useContext(AppContext)
  const [alerts, setAlerts] = useState<InventoryAlertPayload[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const isAdmin = profile?.roles?.includes('Admin') ?? false

  useEffect(() => {
    if (!socket || !isConnected || !isAdmin) return

    const handleInventoryAlert = (data: InventoryAlertPayload) => {
      setAlerts((prev) => [data, ...prev])
      setUnreadCount((prev) => prev + 1)

      if (data.severity === 'critical') {
        toast.error(`🚨 ${data.product_name} đã hết hàng!`, { autoClose: 5000 })
      } else {
        toast.warning(`⚠️ ${data.product_name} chỉ còn ${data.current_quantity} sản phẩm!`, { autoClose: 4000 })
      }
    }

    socket.on(SocketEvent.INVENTORY_ALERT, handleInventoryAlert)

    return () => {
      socket.off(SocketEvent.INVENTORY_ALERT, handleInventoryAlert)
    }
  }, [socket, isConnected, isAdmin])

  const clearAlerts = useCallback(() => {
    setAlerts([])
    setUnreadCount(0)
  }, [])

  return {
    alerts,
    unreadCount,
    clearAlerts
  }
}

export default useInventoryAlerts
