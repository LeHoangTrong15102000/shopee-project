import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { AdminShopsService } from '@services/admin-shops.service'
import { ShopStatus } from '@database/models/shop.model'

const adminShopsService = new AdminShopsService()

export const listShops = async (req: Request, res: Response) => {
  const { page, limit, status, search, sort_by, order } = req.query as {
    page?: string
    limit?: string
    status?: ShopStatus
    search?: string
    sort_by?: string
    order?: 'asc' | 'desc'
  }

  const data = await adminShopsService.listShops({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    status,
    search,
    sort_by,
    order,
  })

  return responseSuccess(res, { message: 'Lấy danh sách shop thành công', data })
}

export const getShopDetail = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await adminShopsService.getShopDetail(id)
  return responseSuccess(res, { message: 'Lấy chi tiết shop thành công', data })
}

export const updateShopStatus = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const { status, reason } = req.body as { status: ShopStatus; reason?: string }
  const data = await adminShopsService.updateShopStatus(id, status, reason)
  return responseSuccess(res, { message: 'Cập nhật trạng thái shop thành công', data })
}

export const getShopProducts = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20
  const data = await adminShopsService.getShopProducts(id, page, limit)
  return responseSuccess(res, { message: 'Lấy sản phẩm shop thành công', data })
}

export const getShopRevenue = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const period = (req.query.period as '7d' | '30d' | '90d' | '1y') || '30d'
  const data = await adminShopsService.getShopRevenue(id, period)
  return responseSuccess(res, { message: 'Lấy doanh thu shop thành công', data })
}

export const adminShopsController = {
  listShops,
  getShopDetail,
  updateShopStatus,
  getShopProducts,
  getShopRevenue,
}
