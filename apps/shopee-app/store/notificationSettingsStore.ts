import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './mmkvStorage'

interface NotificationSettingsState {
  orderUpdates: boolean
  promotions: boolean
  system: boolean
  setOrderUpdates: (value: boolean) => void
  setPromotions: (value: boolean) => void
  setSystem: (value: boolean) => void
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      orderUpdates: true,
      promotions: true,
      system: true,
      setOrderUpdates: (value) => set({ orderUpdates: value }),
      setPromotions: (value) => set({ promotions: value }),
      setSystem: (value) => set({ system: value }),
    }),
    {
      name: 'notification-settings',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
