import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import useSocket from 'src/hooks/useSocket'
import { SocketEvent, PriceUpdatedPayload } from 'src/types/socket.types'

export interface WishlistPriceAlertProps {
  productIds: string[]
  onPriceChange?: (productId: string, oldPrice: number, newPrice: number) => void
}

interface PriceRecord {
  price: number
  lastAlertTime: number
}

const ALERT_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes cooldown between alerts for same product

export default function WishlistPriceAlert({ productIds, onPriceChange }: WishlistPriceAlertProps) {
  const { socket, isConnected } = useSocket()
  const priceHistoryRef = useRef<Map<string, PriceRecord>>(new Map())
  const subscribedProductsRef = useRef<Set<string>>(new Set())

  // Handle price update from socket
  const handlePriceUpdate = useCallback(
    (data: PriceUpdatedPayload) => {
      const { product_id, old_price, new_price } = data

      // Only process if this product is in our watchlist
      if (!productIds.includes(product_id)) return

      // Check if price dropped
      if (new_price >= old_price) return

      // Check cooldown
      const priceRecord = priceHistoryRef.current.get(product_id)
      const now = Date.now()

      if (priceRecord && now - priceRecord.lastAlertTime < ALERT_COOLDOWN_MS) {
        // Still in cooldown, skip toast but still call callback
        onPriceChange?.(product_id, old_price, new_price)
        return
      }

      // Calculate discount percentage
      const discountPercentage = Math.round(((old_price - new_price) / old_price) * 100)

      // Show toast notification
      toast.success(`🎉 Sản phẩm yêu thích đã giảm giá ${discountPercentage}%!`, {
        autoClose: 5000,
        position: 'top-right'
      })

      // Update price history
      priceHistoryRef.current.set(product_id, {
        price: new_price,
        lastAlertTime: now
      })

      // Call callback
      onPriceChange?.(product_id, old_price, new_price)
    },
    [productIds, onPriceChange]
  )

  // Subscribe/unsubscribe to product price updates
  useEffect(() => {
    if (!socket || !isConnected || productIds.length === 0) return

    // Subscribe to new products
    productIds.forEach((productId) => {
      if (!subscribedProductsRef.current.has(productId)) {
        socket.emit(SocketEvent.SUBSCRIBE_PRODUCT, { product_id: productId })
        subscribedProductsRef.current.add(productId)
      }
    })

    // Unsubscribe from products no longer in the list
    subscribedProductsRef.current.forEach((productId) => {
      if (!productIds.includes(productId)) {
        socket.emit(SocketEvent.UNSUBSCRIBE_PRODUCT, { product_id: productId })
        subscribedProductsRef.current.delete(productId)
      }
    })

    // Listen for price updates
    socket.on(SocketEvent.PRICE_UPDATED, handlePriceUpdate)

    return () => {
      socket.off(SocketEvent.PRICE_UPDATED, handlePriceUpdate)
    }
  }, [socket, isConnected, productIds, handlePriceUpdate])

  // Cleanup on unmount
  useEffect(() => {
    const currentSubscribedProducts = subscribedProductsRef.current
    const currentPriceHistory = priceHistoryRef.current

    return () => {
      if (socket && isConnected) {
        currentSubscribedProducts.forEach((productId) => {
          socket.emit(SocketEvent.UNSUBSCRIBE_PRODUCT, { product_id: productId })
        })
        currentSubscribedProducts.clear()
      }
      currentPriceHistory.clear()
    }
  }, [socket, isConnected])

  // This component doesn't render any visible UI
  return null
}
