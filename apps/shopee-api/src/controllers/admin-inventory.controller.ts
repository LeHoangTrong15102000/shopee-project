import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { productService } from '../container'
import { ValidationError, NotFoundError } from '@services/base.service'

const handleError = (error: any) => {
  if (error instanceof ValidationError) throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  if (error instanceof NotFoundError) throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  throw error
}

export const adminGetLowStock = async (req: Request, res: Response) => {
  const { page, limit, threshold } = req.query as any
  const data = await productService.getLowStockProducts(
    Number(threshold) || 10,
    { page: Number(page) || 1, limit: Number(limit) || 20 }
  )
  return responseSuccess(res, { message: 'Lấy danh sách sản phẩm sắp hết hàng thành công', data })
}

export const adminGetOutOfStock = async (req: Request, res: Response) => {
  const { page, limit } = req.query as any
  const data = await productService.getOutOfStockProducts(
    { page: Number(page) || 1, limit: Number(limit) || 20 }
  )
  return responseSuccess(res, { message: 'Lấy danh sách sản phẩm hết hàng thành công', data })
}

export const adminUpdateStock = async (req: Request, res: Response) => {
  try {
    const data = await productService.updateStock(req.params.product_id, req.body.quantity)
    return responseSuccess(res, { message: 'Cập nhật tồn kho thành công', data })
  } catch (error) { handleError(error) }
}

export const adminBulkUpdateStock = async (req: Request, res: Response) => {
  const data = await productService.bulkUpdateStock(req.body.items)
  return responseSuccess(res, { message: 'Cập nhật tồn kho hàng loạt thành công', data })
}

