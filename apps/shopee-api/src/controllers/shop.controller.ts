import { Request, Response } from 'express'
import { ShopService } from '@services/shop.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import { STATUS } from '@constants/status'

const shopService = new ShopService()

export const getShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.jwtDecoded?.id
    const shop = await shopService.getShop(id, userId)
    res.status(STATUS.OK).json({ message: 'Lấy thông tin shop thành công', data: shop })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy shop' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}

export const getShopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const sort = (req.query.sort as string) || 'createdAt'
    const result = await shopService.getShopProducts(id, page, limit, sort)
    res.status(STATUS.OK).json({ message: 'Lấy sản phẩm shop thành công', data: result })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}

export const followShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.jwtDecoded.id
    await shopService.followShop(id, userId)
    res.status(204).send()
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy shop' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}

export const unfollowShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.jwtDecoded.id
    await shopService.unfollowShop(id, userId)
    res.status(204).send()
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy shop' })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
  }
}
