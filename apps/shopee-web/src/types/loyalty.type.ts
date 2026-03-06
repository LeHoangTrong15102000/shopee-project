export interface LoyaltyPoints {
  total_points: number
  available_points: number
  pending_points: number
  expiring_soon: {
    points: number
    expire_date: string
  }
}

export interface PointsTransaction {
  _id: string
  type: 'earn' | 'redeem' | 'expire' | 'bonus'
  points: number
  description: string
  order_id?: string
  createdAt: string
}

export interface PointsReward {
  _id: string
  name: string
  description: string
  points_required: number
  reward_type: 'voucher' | 'discount' | 'gift'
  reward_value: number
  image?: string
  quantity_available: number
  is_active: boolean
}

export interface RedeemPointsResponse {
  success: boolean
  message: string
  remaining_points: number
  reward?: PointsReward
}
