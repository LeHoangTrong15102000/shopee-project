import { useCallback, useState, useRef, useEffect } from 'react'
import { usePrefetch } from './usePrefetch'

interface UseHoverPrefetchOptions {
  /** Delay trước khi prefetch (ms) */
  delay?: number
  /** Có enable prefetching không */
  enabled?: boolean
  /** Strategy để xác định khi nào nên prefetch */
  strategy?: 'immediate' | 'delayed' | 'intent-detection'
}

/**
 * Hook quản lý hover prefetching với optimizations
 * Dựa trên analysis từ ZZ_27_PREFETCHING_INTERSECTION_OBSERVER_ANALYSIS
 */
export const useHoverPrefetch = (productId: string, options: UseHoverPrefetchOptions = {}) => {
  const {
    delay = 300, // 300ms delay - balance tốt giữa UX và efficiency
    enabled = true,
    strategy = 'delayed'
  } = options

  const { prefetchProduct, smartPrefetch, isCached } = usePrefetch()
  const [prefetchState, setPrefetchState] = useState<'idle' | 'queued' | 'prefetched'>('idle')
  const [hoverCount, setHoverCount] = useState(0)
  const [lastHoverTime, setLastHoverTime] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Handle mouse enter với different strategies
   */
  const handleMouseEnter = useCallback(() => {
    if (!enabled || prefetchState === 'prefetched') return

    const now = Date.now()
    setHoverCount((prev) => prev + 1)
    setLastHoverTime(now)

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Decide prefetch strategy
    const shouldPrefetch = (() => {
      switch (strategy) {
        case 'immediate':
          return true

        case 'intent-detection':
          // Intent detection rules
          return (
            hoverCount >= 2 || // Hovered multiple times = interested
            now - lastHoverTime < 2000 || // Quick re-hover = interested
            isCached(['products', productId]) // Already cached
          )

        case 'delayed':
        default:
          return true // Will be delayed by timeout
      }
    })()

    if (shouldPrefetch) {
      if (strategy === 'immediate') {
        // Prefetch immediately
        prefetchProduct(productId)
        setPrefetchState('prefetched')
      } else {
        // Queue for delayed prefetch
        setPrefetchState('queued')
        timeoutRef.current = setTimeout(() => {
          prefetchProduct(productId)
          setPrefetchState('prefetched')

          // Also prefetch related data
          // This is smart prefetching based on user interest
          smartPrefetch.relatedProducts(productId)
        }, delay)
      }
    }
  }, [
    enabled,
    prefetchState,
    strategy,
    hoverCount,
    lastHoverTime,
    delay,
    productId,
    prefetchProduct,
    smartPrefetch,
    isCached
  ])

  /**
   * Handle mouse leave - cancel queued prefetch
   */
  const handleMouseLeave = useCallback(() => {
    if (prefetchState === 'queued' && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      setPrefetchState('idle')
    }
  }, [prefetchState])

  /**
   * Handle click - immediate prefetch if not done
   */
  const handleClick = useCallback(() => {
    if (prefetchState === 'idle') {
      prefetchProduct(productId)
      setPrefetchState('prefetched')
    }
  }, [prefetchState, prefetchProduct, productId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    prefetchState,
    hoverCount,
    isPrefetched: prefetchState === 'prefetched',
    isQueued: prefetchState === 'queued'
  }
}

/**
 * Hook cho Progressive Prefetching - prefetch multiple items with batching
 */
export const useProgressivePrefetch = () => {
  const { prefetchProduct } = usePrefetch()
  const prefetchQueue = useRef<Set<string>>(new Set())
  const processingRef = useRef(false)

  const queuePrefetch = useCallback(
    (productId: string) => {
      prefetchQueue.current.add(productId)

      if (!processingRef.current) {
        processingRef.current = true

        // Process queue after a short delay
        setTimeout(() => {
          const items = Array.from(prefetchQueue.current)

          // Only prefetch first 3 items to limit requests
          const toProcess = items.slice(0, 3)

          toProcess.forEach((id) => {
            prefetchProduct(id)
            prefetchQueue.current.delete(id)
          })

          processingRef.current = false

          // Continue processing if queue not empty
          if (prefetchQueue.current.size > 0) {
            setTimeout(() => {
              processingRef.current = false
            }, 1000) // 1 second delay between batches
          }
        }, 100) // 100ms initial delay
      }
    },
    [prefetchProduct]
  )

  return { queuePrefetch }
}

/**
 * Hook cho Intersection Observer Prefetching
 * Fixed version từ ZZ_27 analysis
 */
export const useIntersectionPrefetch = (productId: string, options: IntersectionObserverInit = {}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const { prefetchProduct } = usePrefetch()
  const hasPrefetched = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasPrefetched.current) return

    // ✅ FIXED: Sử dụng let để observer có thể được reference trong callback
    let observer: IntersectionObserver

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPrefetched.current) {
            prefetchProduct(productId)
            hasPrefetched.current = true

            // ✅ FIXED: Bây giờ observer đã được defined
            observer.unobserve(element)
          }
        })
      },
      {
        rootMargin: '50px', // Prefetch khi còn cách 50px
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [productId, prefetchProduct])

  return elementRef
}

export default useHoverPrefetch
