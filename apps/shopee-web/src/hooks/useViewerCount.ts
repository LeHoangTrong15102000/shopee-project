import { useState, useEffect } from 'react'
import useSocket from './useSocket'
import { SocketEvent, ViewerCountUpdatePayload } from 'src/types/socket.types'

interface UseViewerCountReturn {
  viewerCount: number
  isPopular: boolean
}

// Note: This hook piggybacks on the existing product room subscription
// (already handled by useLivePriceUpdate or direct SUBSCRIBE_PRODUCT).
// It just listens for VIEWER_COUNT_UPDATE events on the product room.
const useViewerCount = (productId: string | undefined): UseViewerCountReturn => {
  const { socket, isConnected } = useSocket()
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    if (!socket || !isConnected || !productId) return

    const handleViewerCountUpdate = (data: ViewerCountUpdatePayload) => {
      if (data.product_id === productId) {
        setViewerCount(data.viewer_count)
      }
    }

    socket.on(SocketEvent.VIEWER_COUNT_UPDATE, handleViewerCountUpdate)

    return () => {
      socket.off(SocketEvent.VIEWER_COUNT_UPDATE, handleViewerCountUpdate)
    }
  }, [socket, isConnected, productId])

  // isPopular when viewerCount > 10
  const isPopular = viewerCount > 10

  return { viewerCount, isPopular }
}

export default useViewerCount
