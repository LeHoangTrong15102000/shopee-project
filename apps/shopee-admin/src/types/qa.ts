export interface QAQuestion {
  _id: string
  user: { _id: string; name: string; email: string; avatar?: string }
  user_id?: string
  title?: string
  content?: string
  answers: QAAnswer[]
  answers_count: number
  likes_count: number
  createdAt: string
  updatedAt: string
}

export interface QAAnswer {
  _id: string
  user: { _id: string; name: string; email: string; avatar?: string }
  question?: string
  content?: string
  answer?: string
  likes_count: number
  createdAt: string
  updatedAt?: string
}
