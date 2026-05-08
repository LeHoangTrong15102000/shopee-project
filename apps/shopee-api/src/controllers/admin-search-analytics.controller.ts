import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { AdminSearchAnalyticsService } from '@services/admin-search-analytics.service'

const searchAnalyticsService = new AdminSearchAnalyticsService()

export const getPopularSearches = async (req: Request, res: Response) => {
  const period = (req.query.period as '7d' | '30d' | '90d') || '30d'
  const data = await searchAnalyticsService.getPopularSearches(period)
  return responseSuccess(res, { message: 'Lấy tìm kiếm phổ biến thành công', data })
}

export const getTrendingSearches = async (_req: Request, res: Response) => {
  const data = await searchAnalyticsService.getTrendingSearches()
  return responseSuccess(res, { message: 'Lấy tìm kiếm xu hướng thành công', data })
}

export const getZeroResultSearches = async (req: Request, res: Response) => {
  const period = (req.query.period as '7d' | '30d') || '30d'
  const data = await searchAnalyticsService.getZeroResultSearches(period)
  return responseSuccess(res, { message: 'Lấy tìm kiếm không có kết quả thành công', data })
}

export const getSearchVolume = async (req: Request, res: Response) => {
  const period = (req.query.period as '30d' | '90d') || '30d'
  const data = await searchAnalyticsService.getSearchVolume(period)
  return responseSuccess(res, { message: 'Lấy khối lượng tìm kiếm thành công', data })
}

export const getOverview = async (req: Request, res: Response) => {
  const period = (req.query.period as '7d' | '30d' | '90d') || '30d'
  const data = await searchAnalyticsService.getOverview(period)
  return responseSuccess(res, { message: 'Lấy tổng quan tìm kiếm thành công', data })
}

export const adminSearchAnalyticsController = {
  getPopularSearches,
  getTrendingSearches,
  getZeroResultSearches,
  getSearchVolume,
  getOverview,
}
