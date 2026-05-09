import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './mmkvStorage'

// TODO: sync with PUT /user/privacy-settings when backend endpoint is available

type ProfileVisibility = 'public' | 'friends' | 'private'

interface PrivacySettingsState {
  profileVisibility: ProfileVisibility
  showOnlineStatus: boolean
  showPurchaseHistory: boolean
  allowShopChat: boolean
  setProfileVisibility: (value: ProfileVisibility) => void
  setShowOnlineStatus: (value: boolean) => void
  setShowPurchaseHistory: (value: boolean) => void
  setAllowShopChat: (value: boolean) => void
}

export const usePrivacySettingsStore = create<PrivacySettingsState>()(
  persist(
    (set) => ({
      profileVisibility: 'public',
      showOnlineStatus: true,
      showPurchaseHistory: false,
      allowShopChat: true,
      setProfileVisibility: (value) => set({ profileVisibility: value }),
      setShowOnlineStatus: (value) => set({ showOnlineStatus: value }),
      setShowPurchaseHistory: (value) => set({ showPurchaseHistory: value }),
      setAllowShopChat: (value) => set({ allowShopChat: value }),
    }),
    {
      name: 'privacy-settings',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
