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

const checkinApi = {
  getCheckinStats: () =>
    http.get<SuccessResponse<CheckinStats>>('admin/checkin'),
}

export default checkinApi
