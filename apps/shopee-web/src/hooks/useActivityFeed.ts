import { useState, useEffect } from 'react'
import useSocket from './useSocket'
import { SocketEvent, ActivityEventPayload, ActivityBufferPayload } from 'src/types/socket.types'

interface UseActivityFeedReturn {
  activities: ActivityEventPayload[]
  latestActivity: ActivityEventPayload | null
}

const useActivityFeed = (productId: string | undefined): UseActivityFeedReturn => {
  const { socket, isConnected } = useSocket()
  const [activities, setActivities] = useState<ActivityEventPayload[]>([])
  const [latestActivity, setLatestActivity] = useState<ActivityEventPayload | null>(null)

  useEffect(() => {
    if (!socket || !isConnected || !productId) return

    // Handle initial activity buffer (sent on room join)
    const handleActivityBuffer = (data: ActivityBufferPayload) => {
      if (data.product_id === productId) {
        setActivities(data.activities)
        if (data.activities.length > 0) {
          setLatestActivity(data.activities[data.activities.length - 1])
        }
      }
    }

    // Handle new activity events
    const handleActivityEvent = (data: ActivityEventPayload) => {
      if (data.product_id === productId) {
        setActivities((prev) => [...prev.slice(-9), data]) // Keep max 10
        setLatestActivity(data)
      }
    }

    socket.on(SocketEvent.ACTIVITY_BUFFER, handleActivityBuffer)
    socket.on(SocketEvent.ACTIVITY_EVENT, handleActivityEvent)

    return () => {
      socket.off(SocketEvent.ACTIVITY_BUFFER, handleActivityBuffer)
      socket.off(SocketEvent.ACTIVITY_EVENT, handleActivityEvent)
      setActivities([])
      setLatestActivity(null)
    }
  }, [socket, isConnected, productId])

  return { activities, latestActivity }
}

export default useActivityFeed
