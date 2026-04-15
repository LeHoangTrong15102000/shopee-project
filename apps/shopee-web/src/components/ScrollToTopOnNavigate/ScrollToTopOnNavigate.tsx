import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Global component that scrolls to top when pathname changes.
 * Only triggers on pathname change, NOT on query param changes.
 * This preserves scroll position for filters/pagination.
 */
export default function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
