import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

interface ScrollPosition {
  pathname: string
  search: string
  scrollY: number
  timestamp: number
}

class ScrollRestorationManager {
  private positions: Map<string, ScrollPosition> = new Map()
  private maxAge = 30 * 60 * 1000 // 30 phút

  savePosition(pathname: string, search: string, scrollY: number) {
    const key = `${pathname}${search}`
    this.positions.set(key, {
      pathname,
      search,
      scrollY,
      timestamp: Date.now()
    })

    // Cleanup old positions
    this.cleanup()
  }

  restorePosition(pathname: string, search: string): number | null {
    const key = `${pathname}${search}`
    const position = this.positions.get(key)

    if (position && Date.now() - position.timestamp < this.maxAge) {
      return position.scrollY
    }

    return null
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, position] of this.positions) {
      if (now - position.timestamp > this.maxAge) {
        this.positions.delete(key)
      }
    }
  }

  getAllPositions() {
    return Array.from(this.positions.entries())
  }

  clearAllPositions() {
    this.positions.clear()
  }
}

// Global scroll manager instance
export const scrollManager = new ScrollRestorationManager()

/**
 * Hook để quản lý scroll restoration cho một route cụ thể
 * @param key - Unique identifier cho scroll position (thường là route path)
 * @param enabled - Có enable scroll restoration hay không (default: true)
 */
export const useScrollRestoration = (key?: string, enabled: boolean = true) => {
  const location = useLocation()
  const prevLocation = useRef(location)
  const isInitialMount = useRef(true)

  // Sử dụng key được truyền vào hoặc tạo key từ location
  const scrollKey = key || `${location.pathname}${location.search}`

  useEffect(() => {
    if (!enabled) return

    // Lưu vị trí của trang trước khi navigate
    if (!isInitialMount.current && prevLocation.current !== location) {
      scrollManager.savePosition(prevLocation.current.pathname, prevLocation.current.search, window.scrollY)
    }

    // Khôi phục vị trí cho trang hiện tại
    const savedPosition = scrollManager.restorePosition(location.pathname, location.search)

    if (savedPosition !== null) {
      // Delay một chút để đảm bảo DOM đã render
      const timer = setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'auto' // Không animate để restore nhanh hơn
        })
      }, 50)

      return () => clearTimeout(timer)
    } else if (!isInitialMount.current) {
      // Scroll về đầu trang cho route mới
      window.scrollTo(0, 0)
    }

    prevLocation.current = location
    isInitialMount.current = false
  }, [location, scrollKey, enabled])

  // Return utility functions
  return {
    saveCurrentPosition: () => {
      if (enabled) {
        scrollManager.savePosition(location.pathname, location.search, window.scrollY)
      }
    },
    restorePosition: (targetScrollY: number) => {
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      })
    },
    scrollToTop: () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
}
