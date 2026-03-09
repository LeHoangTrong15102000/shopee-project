import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { container } from '../container'

const priceService = container.services.price

export const getPriceHistory = async (req: Req, res: Response) => {
  const { productId } = req.params
  const { days = 30 } = req.query

  const result = await priceService.getPriceHistory(productId, Number(days))

  res.status(STATUS.OK).json({
    message: 'Lấy lịch sử giá thành công',
    data: result,
  })
}

export const createPriceAlert = async (req: Request, res: Response) => {
  const userId = req.jwtDecoded?.id
  const { product_id, target_price } = req.body

  const result = await priceService.createPriceAlert(userId!, product_id, Number(target_price))

  res.status(STATUS.OK).json({
    message: 'Tạo cảnh báo giá thành công',
    data: result,
  })
}

export const getPriceAlerts = async (req: Request, res: Response) => {
  const userId = req.jwtDecoded?.id
  const { page, limit, is_active, is_triggered } = req.query

  const filters = {
    is_active: is_active !== undefined ? is_active === 'true' : undefined,
    is_triggered: is_triggered !== undefined ? is_triggered === 'true' : undefined,
  }

  const pagination = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  }

  const result = await priceService.getPriceAlerts(userId!, filters, pagination)

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách cảnh báo giá thành công',
    data: {
      price_alerts: result.data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const deletePriceAlert = async (req: Req, res: Response) => {
  const userId = req.jwtDecoded?.id
  const { alertId } = req.params

  const result = await priceService.deletePriceAlert(userId!, alertId)

  res.status(STATUS.OK).json({
    message: 'Xóa cảnh báo giá thành công',
    data: result,
  })
}

