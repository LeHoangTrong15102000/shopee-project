import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { container } from '../container'

const wishlistService = container.services.wishlist

export const getWishlist = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 10 } = req.query

  const result = await wishlistService.getWishlist(user_id!, {
    page: Number(page),
    limit: Number(limit),
  })

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách yêu thích thành công',
    data: {
      wishlist: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const { product_id } = req.body

  const item = await wishlistService.addToWishlist(user_id!, product_id)

  res.status(STATUS.OK).json({
    message: 'Thêm sản phẩm vào danh sách yêu thích thành công',
    data: item,
  })
}

export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const product_id = req.params.product_id

  await wishlistService.removeFromWishlist(user_id!, product_id)

  res.status(STATUS.OK).json({
    message: 'Xóa sản phẩm khỏi danh sách yêu thích thành công',
  })
}

export const checkInWishlist = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const product_id = req.params.product_id

  const inWishlist = await wishlistService.isInWishlist(user_id!, product_id)

  res.status(STATUS.OK).json({
    message: 'Kiểm tra sản phẩm trong danh sách yêu thích thành công',
    data: { in_wishlist: inWishlist },
  })
}

export const clearWishlist = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const deletedCount = await wishlistService.clearWishlist(user_id!)

  res.status(STATUS.OK).json({
    message: 'Xóa toàn bộ danh sách yêu thích thành công',
    data: { deleted_count: deletedCount },
  })
}

export const getWishlistCount = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const count = await wishlistService.getWishlistCount(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy số lượng sản phẩm yêu thích thành công',
    data: { count },
  })
}

