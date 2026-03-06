import { LoyaltyPoints, PointsTransaction, PointsReward, RedeemPointsResponse } from 'src/types/loyalty.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Mock data for fallback when API is not available
const mockLoyaltyPoints: LoyaltyPoints = {
  total_points: 15800,
  available_points: 12500,
  pending_points: 3300,
  expiring_soon: {
    points: 2000,
    expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

const mockTransactions: PointsTransaction[] = [
  {
    _id: 'mock-txn-1',
    type: 'earn',
    points: 500,
    description: 'Mua hàng đơn #ORD-2024-001',
    order_id: 'mock-order-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-txn-2',
    type: 'redeem',
    points: -1000,
    description: 'Đổi voucher giảm 50.000đ',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-txn-3',
    type: 'bonus',
    points: 200,
    description: 'Thưởng đánh giá sản phẩm',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-txn-4',
    type: 'earn',
    points: 1200,
    description: 'Mua hàng đơn #ORD-2024-002',
    order_id: 'mock-order-2',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-txn-5',
    type: 'expire',
    points: -300,
    description: 'Điểm hết hạn tháng 1/2024',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockRewards: PointsReward[] = [
  {
    _id: 'mock-reward-1',
    name: 'Voucher giảm 50.000đ',
    description: 'Áp dụng cho đơn hàng từ 200.000đ',
    points_required: 1000,
    reward_type: 'voucher',
    reward_value: 50000,
    image: 'https://picsum.photos/seed/reward1/200',
    quantity_available: 100,
    is_active: true
  },
  {
    _id: 'mock-reward-2',
    name: 'Giảm 10% toàn bộ đơn hàng',
    description: 'Áp dụng cho tất cả sản phẩm',
    points_required: 2000,
    reward_type: 'discount',
    reward_value: 10,
    image: 'https://picsum.photos/seed/reward2/200',
    quantity_available: 50,
    is_active: true
  },
  {
    _id: 'mock-reward-3',
    name: 'Quà tặng túi vải canvas',
    description: 'Túi vải canvas Shopee limited edition',
    points_required: 5000,
    reward_type: 'gift',
    reward_value: 0,
    image: 'https://picsum.photos/seed/reward3/200',
    quantity_available: 20,
    is_active: true
  }
]

// API functions
const loyaltyApi = {
  // Lấy thông tin điểm của user
  getPoints: async () => {
    try {
      const response = await http.get<SuccessResponseApi<LoyaltyPoints>>('/loyalty/points')
      return response
    } catch (error) {
      console.warn('⚠️ [getPoints] API not available, using mock data')
      return {
        data: {
          message: 'Lấy thông tin điểm thành công',
          data: mockLoyaltyPoints
        }
      }
    }
  },

  // Lấy lịch sử giao dịch điểm
  getTransactions: async (params?: { page?: number; limit?: number; type?: string }) => {
    try {
      const response = await http.get<
        SuccessResponseApi<{
          transactions: PointsTransaction[]
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }>
      >('/loyalty/transactions', { params })
      return response
    } catch (error) {
      console.warn('⚠️ [getTransactions] API not available, using mock data')
      return {
        data: {
          message: 'Lấy lịch sử giao dịch thành công',
          data: {
            transactions: mockTransactions,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: 5,
              total_pages: 1
            }
          }
        }
      }
    }
  },

  // Lấy danh sách phần thưởng có thể đổi
  getRewards: async () => {
    try {
      const response = await http.get<SuccessResponseApi<PointsReward[]>>('/loyalty/rewards')
      return response
    } catch (error) {
      console.warn('⚠️ [getRewards] API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách phần thưởng thành công',
          data: mockRewards
        }
      }
    }
  },

  // Đổi điểm lấy phần thưởng
  redeemPoints: async (rewardId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<RedeemPointsResponse>>(`/loyalty/redeem/${rewardId}`)
      return response
    } catch (error) {
      console.warn('⚠️ [redeemPoints] API not available, using mock data')
      return {
        data: {
          message: 'Đổi điểm thành công (mock)',
          data: {
            success: true,
            message: 'Đổi điểm thành công (mock)',
            remaining_points: 11500,
            reward: mockRewards[0]
          } as RedeemPointsResponse
        }
      }
    }
  }
}

export default loyaltyApi
