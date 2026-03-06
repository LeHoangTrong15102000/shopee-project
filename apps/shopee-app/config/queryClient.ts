import { QueryClient } from '@tanstack/react-query';

// Smart retry: skip retry for client errors (401, 403, 404, 422)
const NON_RETRYABLE_STATUS = new Set([401, 403, 404, 422]);

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;

  // Check HTTP status from common error shapes
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  if (status && NON_RETRYABLE_STATUS.has(status)) return false;

  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 3 * 60 * 1000, // 3 min — data considered fresh
      gcTime: 10 * 60 * 1000, // 10 min — keep inactive cache
      refetchOnWindowFocus: false, // Not applicable in React Native
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch stale data on mount
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: false, // Never retry mutations
      networkMode: 'online',
    },
  },
});

