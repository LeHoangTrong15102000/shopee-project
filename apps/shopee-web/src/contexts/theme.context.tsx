import { createContext, useState, useEffect, useCallback, useMemo, useContext, ReactNode } from 'react'
import { Theme, ResolvedTheme, ThemeContextValue } from 'src/types/theme.type'

const STORAGE_KEY = 'shopee_theme'

// Helper: Get system preference
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper: Get initial theme from localStorage
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage not available
  }
  return 'system'
}

// Helper: Resolve theme to actual value
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') return getSystemTheme()
  return theme
}

// Helper: Apply theme to DOM — disable transitions & animations during swap to prevent flicker
const applyTheme = (resolvedTheme: ResolvedTheme) => {
  const root = document.documentElement
  const currentTheme = root.classList.contains('dark') ? 'dark' : 'light'

  if (currentTheme !== resolvedTheme) {
    // 1. Inject a temporary <style> to disable ALL transitions AND animations
    //    The original only disabled transitions — CSS animations and framer-motion
    //    keyframes still ran, causing visible flicker during theme swap.
    const css = document.createElement('style')
    css.setAttribute('data-theme-transition', 'disable')
    css.appendChild(
      document.createTextNode(
        `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important;-webkit-animation:none!important;animation:none!important}`
      )
    )
    document.head.appendChild(css)

    // 2. Atomic class swap
    if (!root.classList.replace(currentTheme, resolvedTheme)) {
      root.classList.remove('light', 'dark')
      root.classList.add(resolvedTheme)
    }

    // 3. Update color-scheme for native browser controls (scrollbars, inputs, etc.)
    root.style.colorScheme = resolvedTheme

    // 4. Force reflow by reading a layout property (getComputedStyle alone is NOT enough —
    //    it only triggers style recalculation, not a full reflow/paint).
    //    Then use double requestAnimationFrame to ensure the browser has actually PAINTED
    //    the new theme colors before re-enabling transitions.
    //    setTimeout(fn, 1) was unreliable — the HTML spec clamps it to ~4ms minimum,
    //    and under load it can fire before the browser paints, causing flicker.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    document.body.offsetHeight // Force synchronous reflow

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Safe to remove — browser has painted at least one frame with transitions disabled
        if (css.parentNode) {
          css.parentNode.removeChild(css)
        }
      })
    })
  }

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#ee4d2d')
  }
}

// Context
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Provider
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getInitialTheme()))

  // Set theme and persist — apply DOM changes FIRST before React state updates
  // to prevent the React re-render from causing a visible intermediate state
  const setTheme = useCallback((newTheme: Theme) => {
    const resolved = resolveTheme(newTheme)

    // 1. Apply to DOM immediately (disables transitions, swaps class, forces reflow)
    applyTheme(resolved)

    // 2. Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // localStorage not available
    }

    // 3. Update React state (triggers re-render AFTER DOM is already correct)
    setThemeState(newTheme)
    setResolvedTheme(resolved)
  }, [])

  // Toggle between light/dark
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }, [resolvedTheme, setTheme])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme()
        setResolvedTheme(newResolved)
        applyTheme(newResolved)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Apply theme on mount + cleanup orphaned transition-disable styles
  useEffect(() => {
    applyTheme(resolvedTheme)

    // Safety: clean up any orphaned transition-disable style tags on unmount
    return () => {
      document.querySelectorAll('style[data-theme-transition]').forEach((el) => el.remove())
    }
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
