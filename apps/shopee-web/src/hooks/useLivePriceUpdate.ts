import { useState, useEffect, useRef } from 'react'
import useSocket from './useSocket'
import { SocketEvent, PriceUpdatedPayload, PriceAlertTriggeredPayload } from 'src/types/socket.types'
import { toast } from 'react-toastify'

interface UseLivePriceUpdateReturn {
  price: number | null
  priceBeforeDiscount: number | null
  hasChanged: boolean
  previousPrice: number | null
}

const useLivePriceUpdate = (productId: string | undefined): UseLivePriceUpdateReturn => {
  const { socket, isConnected } = useSocket()
  const [price, setPrice] = useState<number | null>(null)
  const [priceBeforeDiscount, setPriceBeforeDiscount] = useState<number | null>(null)
  const [hasChanged, setHasChanged] = useState(false)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)
  const hasChangedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!socket || !isConnected || !productId) return

    // Subscribe to product room
    socket.emit(SocketEvent.SUBSCRIBE_PRODUCT, { product_id: productId })

    // Handle price updates
    const handlePriceUpdate = (data: PriceUpdatedPayload) => {
      if (data.product_id === productId) {
        setPreviousPrice(data.old_price)
        setPrice(data.new_price)
        setPriceBeforeDiscount(data.new_price_before_discount)
        setHasChanged(true)

        // Reset hasChanged after animation duration
        if (hasChangedTimerRef.current) {
          clearTimeout(hasChangedTimerRef.current)
        }
        hasChangedTimerRef.current = setTimeout(() => {
          setHasChanged(false)
        }, 3000)
      }
    }

    // Handle price alert triggered
    const handlePriceAlert = (data: PriceAlertTriggeredPayload) => {
      toast.success(
        `Giá ${data.product_name} đã giảm xuống ${new Intl.NumberFormat('vi-VN').format(data.new_price)}₫!`,
        { autoClose: 5000 }
      )
    }

    socket.on(SocketEvent.PRICE_UPDATED, handlePriceUpdate)
    socket.on(SocketEvent.PRICE_ALERT_TRIGGERED, handlePriceAlert)

    return () => {
      // Unsubscribe from product room
      socket.emit(SocketEvent.UNSUBSCRIBE_PRODUCT, { product_id: productId })
      socket.off(SocketEvent.PRICE_UPDATED, handlePriceUpdate)
      socket.off(SocketEvent.PRICE_ALERT_TRIGGERED, handlePriceAlert)

      if (hasChangedTimerRef.current) {
        clearTimeout(hasChangedTimerRef.current)
      }
    }
  }, [socket, isConnected, productId])

  return {
    price,
    priceBeforeDiscount,
    hasChanged,
    previousPrice
  }
}

export default useLivePriceUpdate
