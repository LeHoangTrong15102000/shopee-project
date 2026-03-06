import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { AdminDashboardService } from '@services/admin-dashboard.service'
import { PeriodValue } from '@schemas/admin-common.schema'

const dashboardService = new AdminDashboardService()

export const getOverview = async (_req: Request, res: Response) => {
  const data = await dashboardService.getOverview()
  return responseSuccess(res, { message: 'Lấy tổng quan thành công', data })
}

export const getRevenue = async (req: Request, res: Response) => {
  const { period, start_date, end_date } = req.query as {
    period?: PeriodValue
    start_date?: string
    end_date?: string
  }
  const data = await dashboardService.getRevenue(period, start_date, end_date)
  return responseSuccess(res, { message: 'Lấy doanh thu thành công', data })
}

export const getRevenueByCategory = async (req: Request, res: Response) => {
  const period = req.query.period as PeriodValue | undefined
  const data = await dashboardService.getRevenueByCategory(period)
  return responseSuccess(res, { message: 'Lấy doanh thu theo danh mục thành công', data })
}

export const getRevenueByProduct = async (req: Request, res: Response) => {
  const period = req.query.period as PeriodValue | undefined
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const data = await dashboardService.getRevenueByProduct(period, limit)
  return responseSuccess(res, { message: 'Lấy doanh thu theo sản phẩm thành công', data })
}

export const getOrderTrend = async (req: Request, res: Response) => {
  const period = req.query.period as PeriodValue | undefined
  const data = await dashboardService.getOrderTrend(period)
  return responseSuccess(res, { message: 'Lấy xu hướng đơn hàng thành công', data })
}

export const getUserGrowth = async (req: Request, res: Response) => {
  const period = req.query.period as PeriodValue | undefined
  const data = await dashboardService.getUserGrowth(period)
  return responseSuccess(res, { message: 'Lấy tăng trưởng người dùng thành công', data })
}

export const getTopBuyers = async (req: Request, res: Response) => {
  const period = req.query.period as PeriodValue | undefined
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const data = await dashboardService.getTopBuyers(period, limit)
  return responseSuccess(res, { message: 'Lấy top người mua thành công', data })
}

export const adminDashboardController = {
  getOverview,
  getRevenue,
  getRevenueByCategory,
  getRevenueByProduct,
  getOrderTrend,
  getUserGrowth,
  getTopBuyers,
}

