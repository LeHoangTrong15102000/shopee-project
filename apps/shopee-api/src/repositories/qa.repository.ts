import { Types } from 'mongoose'
import { QuestionModel } from '@database/models/question.model'
import {
  IQARepository,
  IQuestionItem,
  IAnswerItem,
  CreateQuestionDTO,
  CreateAnswerDTO,
  QuestionFilterOptions,
} from './interfaces/qa.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class QARepository implements IQARepository {
  async findQuestionsByProduct(
    filters: QuestionFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IQuestionItem>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    type SortOption = { [key: string]: 1 | -1 }
    let sortObj: SortOption = { createdAt: -1 }
    if (filters.sort === 'oldest') sortObj = { createdAt: 1 }
    if (filters.sort === 'most_liked') sortObj = { likes_count: -1, createdAt: -1 }

    const filter = { product_id: filters.product_id }

    const [data, total] = await Promise.all([
      QuestionModel.find(filter).sort(sortObj).skip(skip).limit(limit).lean<IQuestionItem[]>(),
      QuestionModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async findQuestionById(questionId: string | Types.ObjectId): Promise<IQuestionItem | null> {
    return QuestionModel.findById(questionId).lean<IQuestionItem | null>()
  }

  async createQuestion(data: CreateQuestionDTO): Promise<IQuestionItem> {
    const question = new QuestionModel({
      product_id: data.product_id,
      user_id: data.user_id,
      user_name: data.user_name,
      user_avatar: data.user_avatar,
      question: data.question,
      answers: [],
      likes_count: 0,
      liked_by: [],
    })
    const saved = await question.save()
    return saved.toObject() as IQuestionItem
  }

  async addAnswer(
    questionId: string | Types.ObjectId,
    data: CreateAnswerDTO,
  ): Promise<IAnswerItem> {
    const newAnswer = {
      _id: new Types.ObjectId(),
      user_id: new Types.ObjectId(data.user_id.toString()),
      user_name: data.user_name,
      user_avatar: data.user_avatar,
      is_seller: data.is_seller,
      answer: data.answer,
      likes_count: 0,
      liked_by: [],
      created_at: new Date(),
    }

    await QuestionModel.findByIdAndUpdate(questionId, { $push: { answers: newAnswer } })
    return newAnswer as IAnswerItem
  }

  async findAnswerById(
    questionId: string | Types.ObjectId,
    answerId: string | Types.ObjectId,
  ): Promise<IAnswerItem | null> {
    const question = await QuestionModel.findById(questionId).lean<IQuestionItem | null>()
    if (!question) return null
    return question.answers.find((a) => a._id.toString() === answerId.toString()) || null
  }

  async toggleQuestionLike(
    questionId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<{ is_liked: boolean; likes_count: number }> {
    const question = await QuestionModel.findById(questionId)
    if (!question) throw new Error('Question not found')

    const userObjectId = new Types.ObjectId(userId.toString())
    const likedIndex = question.liked_by.findIndex((id) => id.toString() === userId.toString())

    let isLiked = false
    if (likedIndex > -1) {
      question.liked_by.splice(likedIndex, 1)
      question.likes_count = Math.max(0, question.likes_count - 1)
    } else {
      question.liked_by.push(userObjectId)
      question.likes_count += 1
      isLiked = true
    }

    await question.save()
    return { is_liked: isLiked, likes_count: question.likes_count }
  }

  async toggleAnswerLike(
    questionId: string | Types.ObjectId,
    answerId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<{ is_liked: boolean; likes_count: number }> {
    const question = await QuestionModel.findById(questionId)
    if (!question) throw new Error('Question not found')

    const answerIndex = question.answers.findIndex((a) => a._id.toString() === answerId.toString())
    if (answerIndex === -1) throw new Error('Answer not found')

    const answer = question.answers[answerIndex]
    const userObjectId = new Types.ObjectId(userId.toString())
    const likedIndex = answer.liked_by.findIndex((id) => id.toString() === userId.toString())

    let isLiked = false
    if (likedIndex > -1) {
      answer.liked_by.splice(likedIndex, 1)
      answer.likes_count = Math.max(0, answer.likes_count - 1)
    } else {
      answer.liked_by.push(userObjectId)
      answer.likes_count += 1
      isLiked = true
    }

    await question.save()
    return { is_liked: isLiked, likes_count: answer.likes_count }
  }

  async countUnansweredQuestions(): Promise<number> {
    return QuestionModel.countDocuments({ answers: { $size: 0 } })
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async findQuestionsWithFilters(
    filters: { product_id?: string; unanswered?: string; start_date?: string; end_date?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ): Promise<PaginatedResult<IQuestionItem>> {
    const { page, limit, sort_by = 'createdAt', order = 'desc' } = pagination
    const skip = (page - 1) * limit

    const query: Record<string, any> = {}
    if (filters.product_id) query.product_id = new Types.ObjectId(filters.product_id)
    if (filters.unanswered === 'true') query.answers = { $size: 0 }
    if (filters.start_date || filters.end_date) {
      query.createdAt = {}
      if (filters.start_date) query.createdAt.$gte = new Date(filters.start_date)
      if (filters.end_date) query.createdAt.$lte = new Date(filters.end_date + 'T23:59:59.999Z')
    }

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [data, total] = await Promise.all([
      QuestionModel.find(query).sort(sortObj).skip(skip).limit(limit).lean<IQuestionItem[]>(),
      QuestionModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async deleteQuestionById(questionId: string): Promise<void> {
    await QuestionModel.findByIdAndDelete(questionId)
  }

  async removeAnswer(questionId: string, answerId: string): Promise<void> {
    await QuestionModel.findByIdAndUpdate(questionId, {
      $pull: { answers: { _id: new Types.ObjectId(answerId) } },
    })
  }

  async getQAStats() {
    const [totalQuestions, unanswered, answerStats, todayCount, weekCount] = await Promise.all([
      QuestionModel.countDocuments(),
      QuestionModel.countDocuments({ answers: { $size: 0 } }),
      QuestionModel.aggregate([
        { $project: { answer_count: { $size: '$answers' } } },
        {
          $group: {
            _id: null,
            total_answers: { $sum: '$answer_count' },
            avg: { $avg: '$answer_count' },
          },
        },
      ]),
      QuestionModel.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      QuestionModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ])

    return {
      total_questions: totalQuestions,
      total_answers: answerStats[0]?.total_answers || 0,
      unanswered_questions: unanswered,
      avg_answers_per_question: answerStats[0] ? Math.round(answerStats[0].avg * 10) / 10 : 0,
      questions_today: todayCount,
      questions_this_week: weekCount,
    }
  }
}
