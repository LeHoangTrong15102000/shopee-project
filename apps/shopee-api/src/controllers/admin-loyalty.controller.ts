import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { loyaltyService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

const handleError = (error: any) => {
  if (error instanceof ValidationError || error instanceof BusinessError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  throw error
}

export const adminGetRewards = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, reward_type, is_active } = req.query as any
  const data = await loyaltyService.adminGetRewards(
    { reward_type, is_active },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order }
  )
  return responseSuccess(res, { message: 'Lấy danh sách phần thưởng thành công', data })
}

export const adminCreateReward = async (req: Request, res: Response) => {
  try {
    const data = await loyaltyService.adminCreateReward(req.body)
    return responseSuccess(res, { message: 'Tạo phần thưởng thành công', data })
  } catch (error) { handleError(error) }
}

export const adminUpdateReward = async (req: Request, res: Response) => {
  try {
    const data = await loyaltyService.adminUpdateReward(req.params.id as string, req.body)
    return responseSuccess(res, { message: 'Cập nhật phần thưởng thành công', data })
  } catch (error) { handleError(error) }
}

export const adminDeleteReward = async (req: Request, res: Response) => {
  try {
    await loyaltyService.adminDeleteReward(req.params.id as string)
    return responseSuccess(res, { message: 'Xóa phần thưởng thành công' })
  } catch (error) { handleError(error) }
}

export const adminToggleReward = async (req: Request, res: Response) => {
  try {
    const data = await loyaltyService.adminToggleReward(req.params.id as string)
    return responseSuccess(res, { message: 'Cập nhật trạng thái phần thưởng thành công', data })
  } catch (error) { handleError(error) }
}

export const adminAdjustPoints = async (req: Request, res: Response) => {
  try {
    const { user_id, points, type, description } = req.body
    const data = await loyaltyService.adminAdjustPoints(user_id, points, type, description)
    return responseSuccess(res, { message: 'Điều chỉnh điểm thành công', data })
  } catch (error) { handleError(error) }
}

export const adminGetTransactions = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, type, user_id } = req.query as any
  const data = await loyaltyService.adminGetTransactions(
    { type, user_id },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order }
  )
  return responseSuccess(res, { message: 'Lấy danh sách giao dịch thành công', data })
}

export const adminGetLoyaltyStats = async (_req: Request, res: Response) => {
  const data = await loyaltyService.adminGetStats()
  return responseSuccess(res, { message: 'Lấy thống kê loyalty thành công', data })
}

