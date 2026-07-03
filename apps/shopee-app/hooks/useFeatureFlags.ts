import { useQuery } from '@tanstack/react-query'
import { getFeatureFlags } from '@/apis/featureFlags.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const featureFlagKeys = {
  flags: (keys: string[]) => ['feature-flags', ...keys.slice().sort()] as const,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Resolves a set of feature flag keys to their boolean values.
 *
 * Fail-safe contract:
 *  - While loading, all requested keys resolve to false (gated UI stays hidden).
 *  - On request error, all keys resolve to false.
 *  - Keys absent from the backend response resolve to false.
 *
 * staleTime: 5 min — flags change infrequently.
 */
export function useFeatureFlags(keys: string[]): Record<string, boolean> {
  const fallback: Record<string, boolean> = {}
  for (const key of keys) {
    fallback[key] = false
  }

  const { data } = useQuery({
    queryKey: featureFlagKeys.flags(keys),
    queryFn: async () => {
      try {
        const result = await getFeatureFlags(keys)
        // Ensure every requested key has a value (unknown keys default to false)
        const resolved: Record<string, boolean> = {}
        for (const key of keys) {
          resolved[key] = result[key] === true
        }
        return resolved
      } catch {
        // Return all-false fallback on any error
        return fallback
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: keys.length > 0,
  })

  // While loading or if keys is empty, return all-false map
  return data ?? fallback
}
