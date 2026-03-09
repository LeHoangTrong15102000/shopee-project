import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { reviewService } from '../container'
import { ValidationError, NotFoundError } from '@services/base.service'

const handleError = (error: any) => {
  if (error instanceof ValidationError) throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  if (error instanceof NotFoundError) throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  throw error
}

export const adminGetReviews = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, rating, product_id, user_id, search } = req.query as any
  const data = await reviewService.adminGetReviews(
    { rating: rating ? Number(rating) : undefined, product_id, user_id, search },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order }
  )
  return responseSuccess(res, { message: 'Lấy danh sách đánh giá thành công', data })
}

export const adminGetReviewById = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.adminGetReviewById(req.params.id as string)
    return responseSuccess(res, { message: 'Lấy chi tiết đánh giá thành công', data })
  } catch (error) { handleError(error) }
}

export const adminDeleteReview = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.adminDeleteReview(req.params.id as string)
    return responseSuccess(res, { message: 'Xóa đánh giá thành công', data })
  } catch (error) { handleError(error) }
}

export const adminDeleteComment = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.adminDeleteComment(req.params.id as string)
    return responseSuccess(res, { message: 'Xóa bình luận thành công', data })
  } catch (error) { handleError(error) }
}

export const adminGetReviewStats = async (_req: Request, res: Response) => {
  const data = await reviewService.adminGetStats()
  return responseSuccess(res, { message: 'Lấy thống kê đánh giá thành công', data })
}

