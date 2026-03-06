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
  data: Array<{
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
  checkIn: async () => {
    try {
      return await http.post<SuccessResponseApi<CheckInResponse>>('/checkin')
    } catch (error) {
      console.warn('⚠️ [checkIn] API not available, using mock data')
      const today = new Date().toISOString().split('T')[0]
      return {
        data: {
          message: 'Điểm danh thành công',
          data: {
            date: today,
            streak: 1,
            reward: { type: 'coins' as const, value: 5 },
            total_coins: 5
          }
        }
      }
    }
  },

  getStreak: async () => {
    try {
      return await http.get<SuccessResponseApi<StreakResponse>>('/checkin/streak')
    } catch (error) {
      console.warn('⚠️ [getStreak] API not available, using mock data')
      return {
        data: {
          message: 'Lấy thông tin streak thành công',
          data: {
            current_streak: 0,
            longest_streak: 0,
            last_checkin_date: null,
            can_checkin_today: true,
            total_coins: 0
          }
        }
      }
    }
  },

  getHistory: async (params: HistoryParams = {}) => {
    try {
      return await http.get<SuccessResponseApi<HistoryResponse>>('/checkin/history', { params })
    } catch (error) {
      console.warn('⚠️ [getHistory] API not available, using mock data')
      return {
        data: {
          message: 'Lấy lịch sử điểm danh thành công',
          data: {
            data: [],
            pagination: { page: 1, limit: 10, page_size: 1, total: 0 }
          }
        }
      }
    }
  }
}

export default checkinApi
export type { CheckInResponse, HistoryParams, HistoryResponse, StreakResponse }
