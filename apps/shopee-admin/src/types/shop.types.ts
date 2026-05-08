export type ShopStatus = 'pending' | 'active' | 'suspended' | 'banned'

export interface ShopAdmin {
  _id: string
  name: string
  avatar: string
  coverImage: string
  description: string
  rating: number
  responseRate: number
  responseTime: string
  followerCount: number
  productCount: number
  joinedDate: string
  status: ShopStatus
  status_reason?: string
  owner?: string
  revenue?: number
  createdAt: string
  updatedAt: string
}

export interface ShopStats {
  products_count: number
  total_revenue: number
  followers_count: number
  avg_rating: number
}

export interface ShopDetail extends ShopAdmin {
  stats: ShopStats
}

export interface UpdateShopStatusBody {
  status: ShopStatus
  reason?: string
}

export interface ShopRevenuePoint {
  date: string
  revenue: number
  orders: number
}

export interface ShopRevenueData {
  period: string
  data: ShopRevenuePoint[]
}
