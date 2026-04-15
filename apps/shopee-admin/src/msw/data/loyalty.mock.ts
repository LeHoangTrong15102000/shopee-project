import { createMockLoyaltyReward, createMockLoyaltyTransaction } from 'src/test-utils/factories'
import type { LoyaltyReward, LoyaltyTransaction } from 'src/types'

export const mockRewards: LoyaltyReward[] = [
  createMockLoyaltyReward({ _id: 'reward-1', name: 'Giảm 50k', points_required: 500 }),
  createMockLoyaltyReward({ _id: 'reward-2', name: 'Giảm 100k', points_required: 1000 }),
  createMockLoyaltyReward({
    _id: 'reward-3',
    name: 'Free Ship',
    points_required: 200,
    is_active: false,
  }),
]

export const mockTransactions: LoyaltyTransaction[] = [
  createMockLoyaltyTransaction({ _id: 'tx-1', type: 'earn', points: 100, description: 'Mua hàng' }),
  createMockLoyaltyTransaction({
    _id: 'tx-2',
    type: 'redeem',
    points: -500,
    description: 'Đổi voucher',
  }),
  createMockLoyaltyTransaction({
    _id: 'tx-3',
    type: 'adjust',
    points: 50,
    description: 'Admin điều chỉnh',
  }),
]

export const mockLoyaltyStats = {
  total_users: 1200,
  total_points_earned: 500000,
  total_points_redeemed: 150000,
  total_rewards: 3,
  active_rewards: 2,
}
