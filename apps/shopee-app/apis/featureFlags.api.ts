import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Feature Flags API ────────────────────────────────────────────────────────

/**
 * GET feature-flags?keys=key1,key2,key3
 *
 * Sends x-platform header for mobile-specific flag evaluation.
 * Auth is optional — the Http interceptor attaches the token when present.
 * Unknown keys are returned as false by the backend.
 */
export async function getFeatureFlags(keys: string[]): Promise<Record<string, boolean>> {
  if (keys.length === 0) return {}
  const res = await http.get<ApiResponse<Record<string, boolean>>>('feature-flags', {
    params: { keys: keys.join(',') },
    headers: { 'x-platform': 'mobile' },
  })
  return res.data.data
}
