import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 767

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= MOBILE_BREAKPOINT
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    // Sync initial state with media query
    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}
