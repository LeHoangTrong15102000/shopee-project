import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  /** Distance from bottom to trigger (in pixels) */
  threshold?: number
  /** Whether infinite scroll is enabled */
  enabled?: boolean
  /** Callback when threshold is reached */
  onLoadMore: () => void
  /** Whether currently loading */
  isLoading?: boolean
  /** Whether there's more data to load */
  hasMore?: boolean
}

const useInfiniteScroll = ({
  threshold = 200,
  enabled = true,
  onLoadMore,
  isLoading = false,
  hasMore = true
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || isLoading || !hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !isLoading && hasMore) {
          onLoadMore()
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [enabled, isLoading, hasMore, onLoadMore, threshold])

  return { sentinelRef }
}

export default useInfiniteScroll
