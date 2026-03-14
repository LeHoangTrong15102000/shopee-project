import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  enabled?: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}

export function useInfiniteScroll({
  threshold = 0.1,
  enabled = true,
  onLoadMore,
  isLoading = false,
  hasMore = true,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMoreRef.current();
      }
    },
    [hasMore, isLoading],
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
    });

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [enabled, threshold, handleIntersect]);

  return { sentinelRef };
}

