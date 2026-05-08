import { create } from 'zustand'

const NOTIFICATION_SOUND_KEY = 'admin_notification_sound'

function getInitialSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY)
    return stored !== 'false'
  } catch {
    return true
  }
}

interface NotificationState {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  soundEnabled: getInitialSoundEnabled(),
  setSoundEnabled: (enabled: boolean) => {
    try {
      localStorage.setItem(NOTIFICATION_SOUND_KEY, String(enabled))
    } catch {
      // ignore
    }
    set({ soundEnabled: enabled })
  },
}))

/**
 * Non-reactive helper for reading sound preference outside React.
 * Used by useRealtimeOrders to check the toggle at event time.
 */
export function getNotificationSoundEnabled(): boolean {
  return useNotificationStore.getState().soundEnabled
}
