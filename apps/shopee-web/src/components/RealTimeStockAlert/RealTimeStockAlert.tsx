import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import useSocket from 'src/hooks/useSocket'
import { SocketEvent, InventoryAlertPayload } from 'src/types/socket.types'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import Button from 'src/components/Button'

interface RealTimeStockAlertProps {
  productIds: string[]
  onStockChange?: (productId: string, newStock: number) => void
}

interface StockChangeAlert {
  id: string
  productId: string
  productName: string
  newStock: number
  severity: 'warning' | 'critical'
  timestamp: number
}

const AUTO_DISMISS_DELAY = 5000

export default function RealTimeStockAlert({ productIds, onStockChange }: RealTimeStockAlertProps) {
  const { socket, isConnected } = useSocket()
  const prefersReducedMotion = useReducedMotion()
  const [alerts, setAlerts] = useState<StockChangeAlert[]>([])
  const productIdsRef = useRef<Set<string>>(new Set(productIds))

  // Update productIds ref when prop changes
  useEffect(() => {
    productIdsRef.current = new Set(productIds)
  }, [productIds])

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    if (alerts.length === 0) return

    const timers = alerts.map((alert) => {
      const elapsed = Date.now() - alert.timestamp
      const remaining = Math.max(AUTO_DISMISS_DELAY - elapsed, 0)

      return setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      }, remaining)
    })

    return () => timers.forEach(clearTimeout)
  }, [alerts])

  // Handle inventory alert from socket
  const handleInventoryAlert = useCallback(
    (data: InventoryAlertPayload) => {
      // Only process alerts for products in the cart
      if (!productIdsRef.current.has(data.product_id)) return

      const newAlert: StockChangeAlert = {
        id: `${data.product_id}-${Date.now()}`,
        productId: data.product_id,
        productName: data.product_name,
        newStock: data.current_quantity,
        severity: data.severity,
        timestamp: Date.now()
      }

      // Add to local alerts for inline display
      setAlerts((prev) => {
        // Remove existing alert for same product to avoid duplicates
        const filtered = prev.filter((a) => a.productId !== data.product_id)
        return [newAlert, ...filtered]
      })

      // Show toast notification
      if (data.severity === 'critical' || data.current_quantity === 0) {
        toast.error(`🚫 ${data.product_name} đã hết hàng!`, {
          autoClose: AUTO_DISMISS_DELAY,
          position: 'top-right'
        })
      } else if (data.current_quantity <= 5) {
        toast.warning(`⚠️ ${data.product_name} chỉ còn ${data.current_quantity} sản phẩm!`, {
          autoClose: AUTO_DISMISS_DELAY,
          position: 'top-right'
        })
      } else {
        toast.info(`📦 Số lượng ${data.product_name} đã thay đổi: còn ${data.current_quantity} sản phẩm`, {
          autoClose: AUTO_DISMISS_DELAY,
          position: 'top-right'
        })
      }

      // Callback to parent for query invalidation
      onStockChange?.(data.product_id, data.current_quantity)
    },
    [onStockChange]
  )

  // Subscribe to inventory alerts
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on(SocketEvent.INVENTORY_ALERT, handleInventoryAlert)

    return () => {
      socket.off(SocketEvent.INVENTORY_ALERT, handleInventoryAlert)
    }
  }, [socket, isConnected, handleInventoryAlert])

  // Don't render anything if no alerts
  if (alerts.length === 0) return null

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 },
        transition: { duration: 0.3, ease: 'easeOut' }
      }

  return (
    <div className='mb-4 space-y-2'>
      <AnimatePresence mode='popLayout'>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            {...animationProps}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xs ${
              alert.severity === 'critical' || alert.newStock === 0
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
                : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30'
            }`}
          >
            <span className='text-xl'>{alert.severity === 'critical' || alert.newStock === 0 ? '🚫' : '⚠️'}</span>
            <div className='flex-1'>
              <p
                className={`text-sm font-medium ${
                  alert.severity === 'critical' || alert.newStock === 0
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-orange-700 dark:text-orange-400'
                }`}
              >
                {alert.newStock === 0
                  ? `${alert.productName} đã hết hàng!`
                  : `Số lượng tồn kho đã thay đổi: ${alert.productName} còn ${alert.newStock} sản phẩm`}
              </p>
            </div>
            <Button
              animated={false}
              onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              className='text-gray-400 transition-colors hover:text-gray-600'
              aria-label='Đóng thông báo'
            >
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Export inline alert component for individual cart items
export function InlineStockAlert({
  productId: _productId,
  productName: _productName,
  newStock,
  severity,
  onDismiss
}: {
  productId: string
  productName: string
  newStock: number
  severity: 'warning' | 'critical'
  onDismiss: () => void
}) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_DELAY)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: 8 },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3, ease: 'easeOut' }
      }

  const isCritical = severity === 'critical' || newStock === 0

  return (
    <motion.div {...animationProps} className='overflow-hidden'>
      <div
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
          isCritical
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        }`}
      >
        <span>{isCritical ? '🚫' : '⚠️'}</span>
        <span>
          {newStock === 0 ? 'Sản phẩm đã hết hàng!' : `Số lượng tồn kho đã thay đổi: còn ${newStock} sản phẩm`}
        </span>
      </div>
    </motion.div>
  )
}
