import { Types } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'

/**
 * Answer interface
 */
export interface IAnswerItem {
  _id: Types.ObjectId
  user_id: Types.ObjectId
  user_name: string
  user_avatar?: string
  is_seller: boolean
  answer: string
  likes_count: number
  liked_by: Types.ObjectId[]
  created_at: Date
}

/**
 * Question interface
 */
export interface IQuestionItem {
  _id?: Types.ObjectId
  product_id: Types.ObjectId
  user_id: Types.ObjectId
  user_name: string
  user_avatar?: string
  question: string
  answers: IAnswerItem[]
  likes_count: number
  liked_by: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Question with like status for current user
 */
export interface IQuestionWithLikeStatus extends Omit<IQuestionItem, 'answers'> {
  is_liked: boolean
  answers: (IAnswerItem & { is_liked: boolean })[]
}

/**
 * Create question DTO
 */
export interface CreateQuestionDTO {
  product_id: string | Types.ObjectId
  user_id: string | Types.ObjectId
  user_name: string
  user_avatar?: string
  question: string
}

/**
 * Create answer DTO
 */
export interface CreateAnswerDTO {
  user_id: string | Types.ObjectId
  user_name: string
  user_avatar?: string
  is_seller: boolean
  answer: string
}

/**
 * Question filter options
 */
export interface QuestionFilterOptions {
  product_id: string | Types.ObjectId
  sort?: 'newest' | 'oldest' | 'most_liked'
}

/**
 * QA repository interface
 */
export interface IQARepository {
  // Questions
  findQuestionsByProduct(
    filters: QuestionFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IQuestionItem>>

  findQuestionById(questionId: string | Types.ObjectId): Promise<IQuestionItem | null>

  createQuestion(data: CreateQuestionDTO): Promise<IQuestionItem>

  // Answers
  addAnswer(questionId: string | Types.ObjectId, data: CreateAnswerDTO): Promise<IAnswerItem>

  findAnswerById(
    questionId: string | Types.ObjectId,
    answerId: string | Types.ObjectId,
  ): Promise<IAnswerItem | null>

  // Voting
  toggleQuestionLike(
    questionId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<{ is_liked: boolean; likes_count: number }>

  toggleAnswerLike(
    questionId: string | Types.ObjectId,
    answerId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<{ is_liked: boolean; likes_count: number }>

  // Stats
  countUnansweredQuestions(): Promise<number>
}
