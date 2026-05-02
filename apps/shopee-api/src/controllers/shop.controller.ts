import { Request, Response } from 'express'
import { ShopService } from '@services/shop.service'
import { STATUS } from '@constants/status'

const shopService = new ShopService()

export const getShop = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const userId = req.jwtDecoded?.id
  const shop = await shopService.getShop(id, userId)
  res.status(STATUS.OK).json({ message: 'Lấy thông tin shop thành công', data: shop })
}

export const getShopProducts = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20
  const sort = (req.query.sort as string) || 'createdAt'
  const result = await shopService.getShopProducts(id, page, limit, sort)
  res.status(STATUS.OK).json({ message: 'Lấy sản phẩm shop thành công', data: result })
}

export const followShop = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const userId = req.jwtDecoded.id
  await shopService.followShop(id, userId)
  res.status(204).send()
}

export const unfollowShop = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const userId = req.jwtDecoded.id
  await shopService.unfollowShop(id, userId)
  res.status(204).send()
}
