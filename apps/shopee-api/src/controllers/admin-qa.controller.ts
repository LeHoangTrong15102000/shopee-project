import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { qaService } from '../container'
import { ValidationError, NotFoundError } from '@services/base.service'

const handleError = (error: any) => {
  if (error instanceof ValidationError) throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  if (error instanceof NotFoundError) throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  throw error
}

export const adminGetQuestions = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, product_id, unanswered, start_date, end_date } =
    req.query as any
  const data = await qaService.adminGetQuestions(
    { product_id, unanswered, start_date, end_date },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order },
  )
  return responseSuccess(res, { message: 'Lấy danh sách câu hỏi thành công', data })
}

export const adminDeleteQuestion = async (req: Req, res: Response) => {
  try {
    const data = await qaService.adminDeleteQuestion(req.params.id)
    return responseSuccess(res, { message: 'Xóa câu hỏi thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminDeleteAnswer = async (req: Req, res: Response) => {
  try {
    const data = await qaService.adminDeleteAnswer(req.params.question_id, req.params.answer_id)
    return responseSuccess(res, { message: 'Xóa câu trả lời thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminGetQAStats = async (_req: Request, res: Response) => {
  const data = await qaService.adminGetStats()
  return responseSuccess(res, { message: 'Lấy thống kê Q&A thành công', data })
}
