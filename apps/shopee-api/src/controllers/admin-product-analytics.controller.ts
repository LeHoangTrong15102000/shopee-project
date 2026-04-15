import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { AdminDashboardService } from '@services/admin-dashboard.service'
import { PeriodValue } from '@schemas/admin-common.schema'

const dashboardService = new AdminDashboardService()

export const adminGetTopSelling = async (req: Request, res: Response) => {
  const { period, limit } = req.query as any
  const data = await dashboardService.getTopSelling(period as PeriodValue, Number(limit) || 10)
  return responseSuccess(res, { message: 'Lấy sản phẩm bán chạy thành công', data })
}

export const adminGetTopViewed = async (req: Request, res: Response) => {
  const { limit } = req.query as any
  const data = await dashboardService.getTopViewed(Number(limit) || 10)
  return responseSuccess(res, { message: 'Lấy sản phẩm xem nhiều thành công', data })
}

export const adminGetTopRated = async (req: Request, res: Response) => {
  const { limit, min_reviews } = req.query as any
  const data = await dashboardService.getTopRated(Number(limit) || 10, Number(min_reviews) || 1)
  return responseSuccess(res, { message: 'Lấy sản phẩm đánh giá cao thành công', data })
}

export const adminGetStatsByCategory = async (_req: Request, res: Response) => {
  const data = await dashboardService.getStatsByCategory()
  return responseSuccess(res, { message: 'Lấy thống kê theo danh mục thành công', data })
}
