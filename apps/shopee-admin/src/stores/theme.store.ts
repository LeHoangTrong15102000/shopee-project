import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme()
  applyTheme(initial)

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light'
        applyTheme(next)
        return { theme: next }
      }),
    setTheme: (theme) => {
      applyTheme(theme)
      set({ theme })
    },
  }
})
