export interface ProductQuestion {
  _id: string
  product_id: string
  user: {
    _id: string
    name: string
    avatar?: string
  }
  question: string
  answers: ProductAnswer[]
  likes_count: number
  is_liked?: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductAnswer {
  _id: string
  user: {
    _id: string
    name: string
    avatar?: string
    is_seller?: boolean
  }
  answer: string
  likes_count: number
  is_liked?: boolean
  createdAt: string
}

export interface QAListConfig {
  product_id: string
  page?: number | string
  limit?: number | string
  sort_by?: 'newest' | 'most_liked' | 'most_answered'
}
