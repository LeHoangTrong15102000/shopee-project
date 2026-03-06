import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'

const priceService = container.services.price

export const getPriceHistory = async (req: Request, res: Response) => {
  const { productId } = req.params
  const { days = 30 } = req.query

  const result = await priceService.getPriceHistory(productId, Number(days))

  res.status(STATUS.OK).json({
    message: 'Lấy lịch sử giá thành công',
    data: result,
  })
}

export const createPriceAlert = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { product_id, target_price } = req.body

  const priceAlert = await priceService.createPriceAlert(user_id!, product_id, Number(target_price))

  res.status(STATUS.OK).json({
    message: 'Tạo cảnh báo giá thành công',
    data: priceAlert,
  })
}

export const getPriceAlerts = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 10, is_active, is_triggered } = req.query

  const filters = {
    is_active: is_active !== undefined ? is_active === 'true' : undefined,
    is_triggered: is_triggered !== undefined ? is_triggered === 'true' : undefined,
  }

  const result = await priceService.getPriceAlerts(user_id!, filters, {
    page: Number(page),
    limit: Number(limit),
  })

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách cảnh báo giá thành công',
    data: {
      price_alerts: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const deletePriceAlert = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { alertId } = req.params

  const priceAlert = await priceService.deletePriceAlert(user_id!, alertId)

  res.status(STATUS.OK).json({
    message: 'Xóa cảnh báo giá thành công',
    data: priceAlert,
  })
}

