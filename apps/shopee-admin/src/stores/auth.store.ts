import { create } from 'zustand'
import {
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  clearLS,
  setAccessTokenToLS,
  setRefreshTokenToLS,
  setOnTokenRefreshed,
  setOnAuthFailure,
} from 'src/utils/http'
import type { User } from 'src/types'

interface AuthState {
  accessToken: string
  refreshToken: string
  user: User | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  setUser: (user: User) => void
}

function getProfileFromLS(): User | null {
  try {
    const profile = localStorage.getItem('profile')
    return profile ? JSON.parse(profile) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getAccessTokenFromLS(),
  refreshToken: getRefreshTokenFromLS(),
  user: getProfileFromLS(),
  isAuthenticated: Boolean(getAccessTokenFromLS()),

  login: (accessToken, refreshToken, user) => {
    setAccessTokenToLS(accessToken)
    setRefreshTokenToLS(refreshToken)
    localStorage.setItem('profile', JSON.stringify(user))
    set({ accessToken, refreshToken, user, isAuthenticated: true })
  },

  logout: () => {
    clearLS()
    set({ accessToken: '', refreshToken: '', user: null, isAuthenticated: false })
  },

  setTokens: (accessToken, refreshToken) => {
    setAccessTokenToLS(accessToken)
    if (refreshToken) setRefreshTokenToLS(refreshToken)
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
      isAuthenticated: true,
    }))
  },

  setUser: (user) => {
    localStorage.setItem('profile', JSON.stringify(user))
    set({ user })
  },
}))

// Sync Http class token refresh with Zustand store
setOnTokenRefreshed((accessToken) => {
  useAuthStore.getState().setTokens(accessToken)
})

// Handle auth failure — clear store and redirect via router-compatible navigation
setOnAuthFailure(() => {
  useAuthStore.getState().logout()
})
