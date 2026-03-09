import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { orderService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'
import { OrderStatusType } from '@database/models/order.model'

export const getShippingMethods = async (req: Request, res: Response) => {
  return responseSuccess(res, {
    message: 'Lấy phương thức vận chuyển thành công',
    data: orderService.getShippingMethods(),
  })
}

export const getPaymentMethods = async (req: Request, res: Response) => {
  return responseSuccess(res, {
    message: 'Lấy phương thức thanh toán thành công',
    data: orderService.getPaymentMethods(),
  })
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { items, shipping_address_id, shipping_method_id, payment_method, voucher_code, coins_used, note } = req.body

    const order = await orderService.createOrder(user_id, {
      items,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      coins_used,
      note,
    })

    return responseSuccess(res, {
      message: 'Đặt hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const getOrders = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { status, page = 1, limit = 10 } = req.query

    const result = await orderService.getOrders(
      user_id,
      status as OrderStatusType | 'all' | undefined,
      { page: Number(page), limit: Number(limit) }
    )

    return responseSuccess(res, {
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: result.data,
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
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

export const getOrderById = async (req: Req, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { id } = req.params

    const order = await orderService.getOrderById(user_id, id)

    return responseSuccess(res, {
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const cancelOrder = async (req: Req, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { id } = req.params
    const { reason } = req.body

    const order = await orderService.cancelOrder(user_id, id, reason)

    return responseSuccess(res, {
      message: 'Hủy đơn hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const confirmReceived = async (req: Req, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { id } = req.params

    const order = await orderService.confirmReceived(user_id, id)

    return responseSuccess(res, {
      message: 'Xác nhận đã nhận hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const returnOrder = async (req: Req, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const { id } = req.params
    const { reason } = req.body

    const order = await orderService.returnOrder(user_id, id, reason)

    return responseSuccess(res, {
      message: 'Yêu cầu trả hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const adminUpdateStatus = async (req: Req, res: Response) => {
  try {
    const { id } = req.params
    const { status, reason } = req.body

    const order = await orderService.adminUpdateStatus(id, status, { reason })

    return responseSuccess(res, {
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const adminGetOrder = async (req: Req, res: Response) => {
  try {
    const { id } = req.params

    const order = await orderService.adminGetOrder(id)

    return responseSuccess(res, {
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

export const adminGetOrders = async (req: Request, res: Response) => {
  const { page, limit, sort_by, order, status, payment_method, user_id, search, start_date, end_date } = req.query as any
  const data = await orderService.adminGetOrders(
    { status, payment_method, user_id, search, start_date, end_date },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order }
  )
  return responseSuccess(res, { message: 'Lấy danh sách đơn hàng thành công', data })
}

export const adminBulkUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { order_ids, status, reason } = req.body
    const data = await orderService.adminBulkUpdateStatus(order_ids, status, reason)
    return responseSuccess(res, { message: 'Cập nhật trạng thái hàng loạt thành công', data })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

export const adminGetOrderCountByStatus = async (_req: Request, res: Response) => {
  const data = await orderService.adminGetOrderCountByStatus()
  return responseSuccess(res, { message: 'Lấy thống kê đơn hàng theo trạng thái thành công', data })
}

