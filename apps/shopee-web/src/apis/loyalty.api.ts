import {
  LoyaltyPoints,
  PointsTransaction,
  PointsReward,
  RedeemPointsResponse,
} from 'src/types/loyalty.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// API functions
const loyaltyApi = {
  // Lấy thông tin điểm của user
  getPoints: () => {
    return http.get<SuccessResponseApi<LoyaltyPoints>>('/loyalty/points')
  },

  // Lấy lịch sử giao dịch điểm
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) => {
    return http.get<
      SuccessResponseApi<{
        transactions: PointsTransaction[]
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }>
    >('/loyalty/transactions', { params })
  },

  // Lấy danh sách phần thưởng có thể đổi
  getRewards: () => {
    return http.get<SuccessResponseApi<PointsReward[]>>('/loyalty/rewards')
  },

  // Đổi điểm lấy phần thưởng
  redeemPoints: (rewardId: string) => {
    return http.post<SuccessResponseApi<RedeemPointsResponse>>(`/loyalty/redeem/${rewardId}`)
  },
}

export default loyaltyApi
