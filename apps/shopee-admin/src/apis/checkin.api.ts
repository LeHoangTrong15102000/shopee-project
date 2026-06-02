import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface CheckinActivity {
  _id: string
  user: string | { _id: string; name: string; email: string }
  streak: number
  points_earned: number
  createdAt: string
}

export interface CheckinStats {
  total_today: number
  active_streaks: number
  recent_activity: CheckinActivity[]
}

export interface CheckinUserStat {
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  total_checkins: number
  current_streak: number
  longest_streak: number
  last_checkin_date: string
}

export interface CheckinUserListResponse {
  data: CheckinUserStat[]
  pagination: { page: number; limit: number; page_size: number; total: number }
}

export interface CheckinLeaderboardEntry {
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  total_checkins: number
  current_streak: number
  longest_streak: number
}

export interface CheckinDailyStat {
  date: string
  count: number
}

const checkinApi = {
  getCheckinStats: () => http.get<SuccessResponse<CheckinStats>>('admin/checkin'),

  getCheckinUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    http.get<SuccessResponse<CheckinUserListResponse>>('admin/checkin/users', { params }),

  getCheckinLeaderboard: () =>
    http.get<SuccessResponse<CheckinLeaderboardEntry[]>>('admin/checkin/leaderboard'),

  getCheckinDailyStats: () =>
    http.get<SuccessResponse<CheckinDailyStat[]>>('admin/checkin/daily-stats'),
}

export default checkinApi
