import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CheckinStreak {
  streak: number
  last_checkin?: string
  checked_in_today: boolean
  today_reward: number
  calendar: Array<{
    date: string
    checked: boolean
  }>
}

// ─── Check-in API ─────────────────────────────────────────────────────────────

export async function checkIn() {
  const res = await http.post<ApiResponse<{ coins_earned: number; streak: number }>>('checkin')
  return res.data
}

export async function getCheckinStreak() {
  const res = await http.get<ApiResponse<CheckinStreak>>('checkin/streak')
  return res.data
}
