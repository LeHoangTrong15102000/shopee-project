import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { flashSaleService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

const handleError = (error: any): never => {
  if (error instanceof ValidationError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  if (error instanceof BusinessError) {
    throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
  }
  throw error
}

/**
 * GET /flash-sales/active
 * Return all currently ACTIVE flash sales (public, no auth).
 */
export const getActiveFlashSales = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.getActive()
    return responseSuccess(res, {
      message: 'Lấy danh sách flash sale đang hoạt động thành công',
      data,
    })
  } catch (error) {
    handleError(error)
  }
}

/**
 * GET /flash-sales/:id
 * Return flash sale detail if ACTIVE or ENDED, 404 otherwise (public, no auth).
 */
export const getFlashSaleById = async (req: Request, res: Response) => {
  try {
    const data = await flashSaleService.getById(req.params.id as string)

    // Only expose ACTIVE or ENDED flash sales to the public
    if (data.status !== 'ACTIVE' && data.status !== 'ENDED') {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Flash sale không tồn tại')
    }

    return responseSuccess(res, { message: 'Lấy chi tiết flash sale thành công', data })
  } catch (error) {
    if (error instanceof ErrorHandler) throw error
    handleError(error)
  }
}

/**
 * GET /flash-sales/:id/products
 * Return products in a flash sale with current stock (public, no auth).
 */
export const getFlashSaleProducts = async (req: Request, res: Response) => {
  try {
    const flashSale = await flashSaleService.getById(req.params.id as string)

    // Only expose ACTIVE or ENDED flash sales to the public
    if (flashSale.status !== 'ACTIVE' && flashSale.status !== 'ENDED') {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Flash sale không tồn tại')
    }

    const products = flashSale.products.map((p) => ({
      product_id: p.productId.toString(),
      original_price: p.originalPrice,
      flash_price: p.flashPrice,
      total_quantity: p.totalQuantity,
      sold_quantity: p.soldQuantity,
      remaining_quantity: p.totalQuantity - p.soldQuantity,
      limit_per_user: p.limitPerUser,
    }))

    return responseSuccess(res, {
      message: 'Lấy danh sách sản phẩm flash sale thành công',
      data: products,
    })
  } catch (error) {
    if (error instanceof ErrorHandler) throw error
    handleError(error)
  }
}
