import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'

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

export interface CheckinHistoryItem {
  date: string
  xu_earned: number
  streak_day: number
}

export interface CheckinHistoryResponse {
  items: CheckinHistoryItem[]
  pagination: Pagination
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

export async function getCheckinHistory(page = 1, limit = 20) {
  const res = await http.get<ApiResponse<CheckinHistoryResponse>>('checkin/history', {
    params: { page, limit },
  })
  return res.data
}

