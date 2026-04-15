import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { container } from '../container'
import { emitNewQuestion, emitNewAnswer, emitQuestionLiked } from '../socket/utils/qa-emit'
import { emitSellerQANotification } from '../socket/utils/seller-emit'
import { emitCurrentSellerMetrics } from '../socket/utils/seller-metrics.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import { ErrorHandler, NotFoundError as HttpNotFoundError } from '@utils/response'

const qaService = container.services.qa

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  const { product_id, page = 1, limit = 10, sort = 'newest' } = req.query
  const user_id = req.jwtDecoded?.id

  const result = await qaService.getQuestions(
    product_id as string,
    user_id,
    sort as 'newest' | 'oldest' | 'most_liked',
    { page: Number(page), limit: Number(limit) },
  )

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách câu hỏi thành công',
    data: {
      questions: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const askQuestion = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { product_id, question } = req.body

  const { question: newQuestion, product } = await qaService.askQuestion(
    user_id!,
    product_id,
    question,
  )

  // WebSocket: Emit new question to product room (fire-and-forget)
  void (async () => {
    try {
      emitNewQuestion(product_id, {
        _id: newQuestion._id!.toString(),
        user_name: newQuestion.user_name,
        user_avatar: newQuestion.user_avatar,
        question: newQuestion.question,
        createdAt: newQuestion.createdAt?.toISOString?.() || new Date().toISOString(),
      })
      emitSellerQANotification('admin', {
        product_id,
        product_name: product.name,
        question_id: newQuestion._id!.toString(),
        question_preview: question.substring(0, 100),
        user_name: newQuestion.user_name,
      })
      await emitCurrentSellerMetrics('admin')
    } catch (_) {
      /* non-critical */
    }
  })()

  res.status(STATUS.OK).json({
    message: 'Đặt câu hỏi thành công',
    data: newQuestion,
  })
}

export const answerQuestion = async (req: Req, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { questionId } = req.params
  const { answer, is_seller = false } = req.body

  const { answer: newAnswer, productId } = await qaService.answerQuestion(
    user_id!,
    questionId,
    answer,
    is_seller,
  )

  // WebSocket: Emit new answer to product room (fire-and-forget)
  void (() => {
    try {
      emitNewAnswer(productId, questionId, {
        user_name: newAnswer.user_name,
        user_avatar: newAnswer.user_avatar,
        answer: newAnswer.answer,
        is_seller: newAnswer.is_seller,
        createdAt: newAnswer.created_at.toISOString(),
      })
    } catch (_) {
      /* non-critical */
    }
  })()

  res.status(STATUS.OK).json({
    message: 'Trả lời câu hỏi thành công',
    data: newAnswer,
  })
}

export const likeQuestion = async (req: Req, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { questionId } = req.params

  const { is_liked, likes_count, productId } = await qaService.likeQuestion(user_id!, questionId)

  // WebSocket: Emit question liked to product room (fire-and-forget)
  void (() => {
    try {
      emitQuestionLiked(productId, questionId, likes_count)
    } catch (_) {
      /* non-critical */
    }
  })()

  res.status(STATUS.OK).json({
    message: is_liked ? 'Thích câu hỏi thành công' : 'Bỏ thích câu hỏi thành công',
    data: { is_liked, likes_count },
  })
}

export const likeAnswer = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const { questionId, answerId } = req.params

    const { is_liked, likes_count } = await qaService.likeAnswer(user_id!, questionId, answerId)

    res.status(STATUS.OK).json({
      message: is_liked ? 'Thích câu trả lời thành công' : 'Bỏ thích câu trả lời thành công',
      data: { is_liked, likes_count },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new HttpNotFoundError(error.message)
    }
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
    }
    throw error
  }
}
