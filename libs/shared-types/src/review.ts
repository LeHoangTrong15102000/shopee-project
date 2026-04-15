export interface Review {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  product: {
    _id: string
    name: string
    image: string
  }
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  comments_count?: number
  createdAt: string
  updatedAt: string
}

export interface ReviewComment {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  review: string
  content: string
  parent_comment?: string
  level: number
  replies_count: number
  createdAt: string
  updatedAt: string
  replies?: ReviewComment[]
}
