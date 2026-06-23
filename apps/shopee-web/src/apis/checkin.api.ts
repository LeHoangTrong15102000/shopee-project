import { CheckInReward } from 'src/types/checkin.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Backend response types
interface CheckInResponse {
  date: string
  streak: number
  reward: CheckInReward
  total_coins: number
}

interface StreakResponse {
  current_streak: number
  longest_streak: number
  last_checkin_date: string | null
  can_checkin_today: boolean
  total_coins: number
}

interface HistoryParams {
  page?: number
  limit?: number
}

interface HistoryResponse {
  history: Array<{
    _id: string
    user_id: string
    date: string
    streak_day: number
    reward_type: string
    reward_value: number
  }>
  pagination: {
    page: number
    limit: number
    page_size: number
    total: number
  }
}

const checkinApi = {
  checkIn: () => {
    return http.post<SuccessResponseApi<CheckInResponse>>('/checkin')
  },

  getStreak: () => {
    return http.get<SuccessResponseApi<StreakResponse>>('/checkin/streak')
  },

  getHistory: (params: HistoryParams = {}) => {
    return http.get<SuccessResponseApi<HistoryResponse>>('/checkin/history', { params })
  },
}

export default checkinApi
export type { CheckInResponse, HistoryParams, HistoryResponse, StreakResponse }
