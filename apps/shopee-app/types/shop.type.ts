export interface Shop {
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
  isFollowing: boolean
  createdAt: string
  updatedAt: string
}

export interface ShopSummary {
  _id: string
  name: string
  avatar: string
  rating: number
}

export interface ShopProductsResponse {
  data: import('./product.type').Product[]
  total: number
  page: number
  limit: number
}
