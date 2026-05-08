import { useEffect } from 'react'
import { toast } from 'sonner'
import { socketClient } from 'src/lib/socket'
import { getNotificationSoundEnabled } from 'src/stores/notification.store'

interface AdminNewOrderPayload {
  order_id: string
  buyer_name: string
  items_count: number
  total_amount: number
  created_at: string
}

const ADMIN_NEW_ORDER_EVENT = 'admin_new_order'

let notificationAudio: HTMLAudioElement | null = null

function getNotificationAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!notificationAudio) {
    try {
      notificationAudio = new Audio('/notification.mp3')
      notificationAudio.volume = 0.5
    } catch {
      return null
    }
  }
  return notificationAudio
}

function playNotificationSound(): void {
  try {
    const audio = getNotificationAudio()
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {
        // Autoplay blocked — silently ignore
      })
    }
  } catch {
    // Ignore audio errors
  }
}

/**
 * Subscribes to admin_new_order socket events.
 * Shows a toast notification and plays a sound for each new order.
 */
export function useRealtimeOrders(): void {
  useEffect(() => {
    const unsubscribe = socketClient.subscribe<AdminNewOrderPayload>(
      ADMIN_NEW_ORDER_EVENT,
      (payload) => {
        if (getNotificationSoundEnabled()) {
          playNotificationSound()
        }
        toast.info(`New order from ${payload.buyer_name}`, {
          description: `${payload.items_count} item(s) — ${payload.total_amount.toLocaleString('vi-VN')}₫`,
          duration: 6000,
        })
      },
    )

    return unsubscribe
  }, [])
}
