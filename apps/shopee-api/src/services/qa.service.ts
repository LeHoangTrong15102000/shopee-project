import { Types } from 'mongoose'
import {
  IQARepository,
  IQuestionItem,
  IQuestionWithLikeStatus,
  IAnswerItem,
  QuestionFilterOptions,
} from '@repositories/interfaces/qa.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError } from './base.service'

export class QAService extends BaseService {
  constructor(
    private readonly qaRepository: IQARepository,
    private readonly productRepository: IProductRepository,
    private readonly userRepository: IUserRepository
  ) {
    super()
  }

  async getQuestions(
    productId: string,
    userId: string | undefined,
    sort: 'newest' | 'oldest' | 'most_liked' = 'newest',
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IQuestionWithLikeStatus>> {
    if (!productId) {
      throw new ValidationError('Product ID là bắt buộc')
    }

    const filters: QuestionFilterOptions = { product_id: productId, sort }
    const result = await this.qaRepository.findQuestionsByProduct(filters, this.normalizePagination(pagination))

    // Add like status for current user
    const questionsWithLikeStatus: IQuestionWithLikeStatus[] = result.data.map((q) => ({
      ...q,
      is_liked: userId ? q.liked_by.some((id) => id.toString() === userId) : false,
      answers: q.answers.map((a) => ({
        ...a,
        is_liked: userId ? a.liked_by.some((id) => id.toString() === userId) : false,
      })),
    }))

    return {
      data: questionsWithLikeStatus,
      pagination: result.pagination,
    }
  }

  async askQuestion(
    userId: string,
    productId: string,
    question: string
  ): Promise<{ question: IQuestionItem; product: { name: string } }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }

    const newQuestion = await this.qaRepository.createQuestion({
      product_id: new Types.ObjectId(productId),
      user_id: new Types.ObjectId(userId),
      user_name: user.name || 'Người dùng',
      user_avatar: user.avatar,
      question,
    })

    return { question: newQuestion, product: { name: product.name } }
  }

  async answerQuestion(
    userId: string,
    questionId: string,
    answer: string,
    isSeller: boolean = false
  ): Promise<{ answer: IAnswerItem; productId: string }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(questionId)) {
      throw new ValidationError('Invalid question ID format')
    }

    const question = await this.qaRepository.findQuestionById(questionId)
    if (!question) {
      throw new NotFoundError('Question', questionId)
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }

    const newAnswer = await this.qaRepository.addAnswer(questionId, {
      user_id: new Types.ObjectId(userId),
      user_name: user.name || 'Người dùng',
      user_avatar: user.avatar,
      is_seller: isSeller,
      answer,
    })

    return { answer: newAnswer, productId: question.product_id.toString() }
  }

  async likeQuestion(
    userId: string,
    questionId: string
  ): Promise<{ is_liked: boolean; likes_count: number; productId: string }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(questionId)) {
      throw new ValidationError('Invalid question ID format')
    }

    const question = await this.qaRepository.findQuestionById(questionId)
    if (!question) {
      throw new NotFoundError('Question', questionId)
    }

    const result = await this.qaRepository.toggleQuestionLike(questionId, userId)
    return { ...result, productId: question.product_id.toString() }
  }

  async likeAnswer(
    userId: string,
    questionId: string,
    answerId: string
  ): Promise<{ is_liked: boolean; likes_count: number }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(questionId)) {
      throw new ValidationError('Invalid question ID format')
    }
    if (!this.isValidObjectId(answerId)) {
      throw new ValidationError('Invalid answer ID format')
    }

    const question = await this.qaRepository.findQuestionById(questionId)
    if (!question) {
      throw new NotFoundError('Question', questionId)
    }

    const answer = question.answers.find((a) => a._id.toString() === answerId)
    if (!answer) {
      throw new NotFoundError('Answer', answerId)
    }

    return this.qaRepository.toggleAnswerLike(questionId, answerId, userId)
  }

  async countUnansweredQuestions(): Promise<number> {
    return this.qaRepository.countUnansweredQuestions()
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async adminGetQuestions(
    filters: { product_id?: string; unanswered?: string; start_date?: string; end_date?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' }
  ) {
    return (this.qaRepository as any).findQuestionsWithFilters(filters, pagination)
  }

  async adminDeleteQuestion(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid question ID')
    const question = await this.qaRepository.findQuestionById(id)
    if (!question) throw new NotFoundError('Question', id)
    await (this.qaRepository as any).deleteQuestionById(id)
    return { deleted: true }
  }

  async adminDeleteAnswer(questionId: string, answerId: string) {
    if (!this.isValidObjectId(questionId)) throw new ValidationError('Invalid question ID')
    if (!this.isValidObjectId(answerId)) throw new ValidationError('Invalid answer ID')
    const question = await this.qaRepository.findQuestionById(questionId)
    if (!question) throw new NotFoundError('Question', questionId)
    const answer = question.answers.find((a) => a._id.toString() === answerId)
    if (!answer) throw new NotFoundError('Answer', answerId)
    await (this.qaRepository as any).removeAnswer(questionId, answerId)
    return { deleted: true }
  }

  async adminGetStats() {
    return (this.qaRepository as any).getQAStats()
  }
}

