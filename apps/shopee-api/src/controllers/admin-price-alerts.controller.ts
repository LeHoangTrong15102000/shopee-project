import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { container } from '../container'

const priceService = container.services.price

export const adminGetPriceAlerts = async (req: Request, res: Response) => {
  const { page, limit, user_id, product_id, status } = req.query as any
  const data = await priceService.adminGetAlerts(
    { user_id, product_id, status },
    { page: Number(page) || 1, limit: Number(limit) || 20 },
  )
  return responseSuccess(res, { message: 'Lấy danh sách cảnh báo giá thành công', data })
}

export const adminGetPriceAlertStats = async (_req: Request, res: Response) => {
  const data = await priceService.adminGetAlertStats()
  return responseSuccess(res, { message: 'Lấy thống kê cảnh báo giá thành công', data })
}

export const adminDeletePriceAlert = async (req: Request, res: Response) => {
  const data = await priceService.adminDeleteAlert(req.params.id as string)
  return responseSuccess(res, { message: 'Xóa cảnh báo giá thành công', data })
}
