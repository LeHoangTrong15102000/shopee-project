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

export interface ShopProductsParams {
  page?: number | string
  limit?: number | string
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
  name?: string
}
