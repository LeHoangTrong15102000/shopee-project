import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { voucherService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

const handleError = (error: any) => {
  if (error instanceof ValidationError || error instanceof BusinessError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  throw error
}

export const adminGetVouchers = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, is_active, discount_type, status, search } = req.query as any
  const data = await voucherService.adminGetVouchers(
    { is_active, discount_type, status, search },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order },
  )
  return responseSuccess(res, { message: 'Lấy danh sách voucher thành công', data })
}

export const adminGetVoucherById = async (req: Request, res: Response) => {
  try {
    const data = await voucherService.adminGetById(req.params.id as string)
    return responseSuccess(res, { message: 'Lấy chi tiết voucher thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminCreateVoucher = async (req: Request, res: Response) => {
  try {
    const data = await voucherService.adminCreate(req.body)
    return responseSuccess(res, { message: 'Tạo voucher thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminUpdateVoucher = async (req: Request, res: Response) => {
  try {
    const data = await voucherService.adminUpdate(req.params.id as string, req.body)
    return responseSuccess(res, { message: 'Cập nhật voucher thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminDeleteVoucher = async (req: Request, res: Response) => {
  try {
    await voucherService.adminDelete(req.params.id as string)
    return responseSuccess(res, { message: 'Xóa voucher thành công' })
  } catch (error) {
    handleError(error)
  }
}

export const adminToggleVoucher = async (req: Request, res: Response) => {
  try {
    const data = await voucherService.adminToggle(req.params.id as string)
    return responseSuccess(res, { message: 'Cập nhật trạng thái voucher thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminGetVoucherUsage = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any
    const data = await voucherService.adminGetUsage(req.params.id as string, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    })
    return responseSuccess(res, { message: 'Lấy lịch sử sử dụng voucher thành công', data })
  } catch (error) {
    handleError(error)
  }
}

export const adminGetVoucherStats = async (_req: Request, res: Response) => {
  const data = await voucherService.adminGetStats()
  return responseSuccess(res, { message: 'Lấy thống kê voucher thành công', data })
}
