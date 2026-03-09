import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { voucherService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

export const getVouchers = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, discount_type } = req.query

  const result = await voucherService.getAvailableVouchers(
    { page: Number(page), limit: Number(limit) },
    undefined,
    discount_type ? { discount_type: discount_type as 'percentage' | 'fixed' } : undefined
  )

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách voucher thành công',
    data: {
      vouchers: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const getVoucherByCode = async (req: Req, res: Response): Promise<void> => {
  try {
    const { code } = req.params
    const result = await voucherService.getVoucherByCode(code)

    res.status(STATUS.OK).json({
      message: 'Lấy thông tin voucher thành công',
      data: result,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy voucher' })
      return
    }
    throw error
  }
}

export const applyVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, order_value, product_ids = [], category_ids = [] } = req.body
    const result = await voucherService.applyVoucher({ code, order_value, product_ids, category_ids })

    res.status(STATUS.OK).json({
      message: 'Áp dụng voucher thành công',
      data: result,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy voucher' })
      return
    }
    if (error instanceof BusinessError || error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    throw error
  }
}

export const saveVoucher = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const voucher_id = req.params.id

    const result = await voucherService.collectVoucher(user_id!, voucher_id)

    res.status(STATUS.OK).json({
      message: 'Lưu voucher thành công',
      data: result,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy voucher' })
      return
    }
    if (error instanceof BusinessError || error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    throw error
  }
}

export const getSavedVouchers = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded?.id
    const { page = 1, limit = 10 } = req.query

    const result = await voucherService.getSavedVouchers(user_id!, { page: Number(page), limit: Number(limit) })

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách voucher đã lưu thành công',
      data: {
        saved_vouchers: result.data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.page_size,
        },
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    throw error
  }
}

export const getAvailableVouchers = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 10, discount_type } = req.query

  const result = await voucherService.getAvailableVouchers(
    { page: Number(page), limit: Number(limit) },
    user_id,
    discount_type ? { discount_type: discount_type as 'percentage' | 'fixed' } : undefined
  )

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách voucher khả dụng thành công',
    data: {
      vouchers: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const getMyVouchers = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded?.id
    const { page = 1, limit = 10, status } = req.query

    const result = await voucherService.getSavedVouchers(
      user_id!,
      { page: Number(page), limit: Number(limit) },
      status as 'available' | 'used' | 'expired' | undefined
    )

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách voucher của tôi thành công',
      data: {
        vouchers: result.data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.page_size,
        },
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    throw error
  }
}

export const collectVoucher = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const voucher_id = req.params.id

    const result = await voucherService.collectVoucher(user_id!, voucher_id)

    res.status(STATUS.OK).json({
      message: 'Thu thập voucher thành công',
      data: result,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy voucher' })
      return
    }
    if (error instanceof BusinessError || error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    throw error
  }
}

export const validateVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const { code, order_total } = req.body

    const result = await voucherService.validateVoucher(user_id!, code, order_total)

    res.status(STATUS.OK).json({
      message: 'Voucher hợp lệ',
      data: result,
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy voucher', data: { is_valid: false } })
      return
    }
    if (error instanceof BusinessError || error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message, data: { is_valid: false } })
      return
    }
    throw error
  }
}

