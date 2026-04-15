import http from 'src/utils/http'
import type { SuccessResponse, LoyaltyReward, LoyaltyTransaction } from 'src/types'

interface RewardListParams {
  page?: number
  limit?: number
  is_active?: boolean
}

interface RewardListResponse {
  rewards: LoyaltyReward[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface TransactionListParams {
  page?: number
  limit?: number
  type?: 'earn' | 'redeem' | 'adjust'
  user_id?: string
  sort_by?: string
  order?: string
}

interface TransactionListResponse {
  transactions: LoyaltyTransaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface LoyaltyStats {
  total_users: number
  total_points_earned: number
  total_points_redeemed: number
  total_rewards: number
  active_rewards: number
}

interface CreateRewardBody {
  name: string
  description: string
  points_required: number
  is_active?: boolean
}

interface AdjustPointsBody {
  user_id: string
  points: number
  description: string
}

const loyaltyApi = {
  getRewards: (params?: RewardListParams) =>
    http.get<SuccessResponse<RewardListResponse>>('admin/loyalty/rewards', { params }),

  createReward: (body: CreateRewardBody) =>
    http.post<SuccessResponse<LoyaltyReward>>('admin/loyalty/rewards', body),

  updateReward: (id: string, body: Partial<CreateRewardBody>) =>
    http.put<SuccessResponse<LoyaltyReward>>(`admin/loyalty/rewards/${id}`, body),

  deleteReward: (id: string) => http.delete<SuccessResponse<null>>(`admin/loyalty/rewards/${id}`),

  toggleReward: (id: string) =>
    http.patch<SuccessResponse<LoyaltyReward>>(`admin/loyalty/rewards/${id}/toggle`),

  adjustPoints: (body: AdjustPointsBody) =>
    http.post<SuccessResponse<LoyaltyTransaction>>('admin/loyalty/points/adjust', body),

  getTransactions: (params?: TransactionListParams) =>
    http.get<SuccessResponse<TransactionListResponse>>('admin/loyalty/transactions', { params }),

  getStats: () => http.get<SuccessResponse<LoyaltyStats>>('admin/loyalty/stats'),
}

export default loyaltyApi
