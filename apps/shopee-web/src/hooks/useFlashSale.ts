import { useState, useEffect, useRef } from 'react'
import useSocket from './useSocket'
import {
  SocketEvent,
  FlashSaleTickPayload,
  FlashSaleStockUpdatePayload,
  FlashSaleTickProduct
} from 'src/types/socket.types'

interface UseFlashSaleReturn {
  remainingSeconds: number
  products: FlashSaleTickProduct[]
  isActive: boolean
  isEnded: boolean
  isConnectedToServer: boolean
}

const useFlashSale = (saleId: string | undefined): UseFlashSaleReturn => {
  const { socket, isConnected } = useSocket()
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [products, setProducts] = useState<FlashSaleTickProduct[]>([])
  const [isActive, setIsActive] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [isConnectedToServer, setIsConnectedToServer] = useState(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const lastServerTickRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!socket || !isConnected || !saleId) {
      // Fallback: if disconnected but was active, use local countdown
      if (isActive && remainingSeconds > 0 && !isConnectedToServer) {
        fallbackTimerRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              setIsEnded(true)
              setIsActive(false)
              if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
      return () => {
        if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current)
      }
    }

    // Subscribe to flash sale room
    socket.emit(SocketEvent.SUBSCRIBE_FLASH_SALE, { sale_id: saleId })
    setIsConnectedToServer(true)

    // Clear fallback timer when connected
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current)
      fallbackTimerRef.current = undefined
    }

    // Handle flash sale tick (every 1s from server)
    const handleFlashSaleTick = (data: FlashSaleTickPayload) => {
      if (data.sale_id === saleId) {
        setRemainingSeconds(data.remaining_seconds)
        setProducts(data.products)
        setIsActive(data.remaining_seconds > 0)
        setIsEnded(data.remaining_seconds <= 0)
        lastServerTickRef.current = Date.now()
      }
    }

    // Handle stock update (someone bought something)
    const handleStockUpdate = (data: FlashSaleStockUpdatePayload) => {
      if (data.sale_id === saleId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === data.product_id ? { ...p, current_stock: data.current_stock, sold: data.sold } : p
          )
        )
      }
    }

    socket.on(SocketEvent.FLASH_SALE_TICK, handleFlashSaleTick)
    socket.on(SocketEvent.FLASH_SALE_STOCK_UPDATE, handleStockUpdate)

    return () => {
      socket.emit(SocketEvent.UNSUBSCRIBE_FLASH_SALE, { sale_id: saleId })
      socket.off(SocketEvent.FLASH_SALE_TICK, handleFlashSaleTick)
      socket.off(SocketEvent.FLASH_SALE_STOCK_UPDATE, handleStockUpdate)
      setIsConnectedToServer(false)
      if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current)
    }
  }, [socket, isConnected, saleId])

  return { remainingSeconds, products, isActive, isEnded, isConnectedToServer }
}

export default useFlashSale
