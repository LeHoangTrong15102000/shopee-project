import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { orderService, paymentService } from '../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'
import { OrderStatusType } from '@database/models/order.model'
import { ShippingMethodModel, IShippingMethod } from '@database/models/shipping-method.model'
import { PaymentMethodModel, IPaymentMethod } from '@database/models/payment-method.model'

export const getShippingMethods = async (_req: Request, res: Response) => {
  // Try DB first; fall back to static list if collection is empty (e.g. before seeding)
  const dbMethods = await ShippingMethodModel.find({ is_active: true })
    .sort({ sort_order: 1 })
    .lean<IShippingMethod[]>()
  if (dbMethods.length > 0) {
    const normalizedMethods = dbMethods.map((m) => {
      const estimatedDays =
        m.estimated_days_min === m.estimated_days_max
          ? String(m.estimated_days_min)
          : `${m.estimated_days_min}-${m.estimated_days_max}`
      return {
        _id: m._id,
        name: m.name,
        description: m.description ?? '',
        price: m.price,
        estimatedDays,
        icon: m.icon ?? '',
      }
    })
    return responseSuccess(res, {
      message: 'Lấy phương thức vận chuyển thành công',
      data: normalizedMethods,
    })
  }
  return responseSuccess(res, {
    message: 'Lấy phương thức vận chuyển thành công',
    data: orderService.getShippingMethods(),
  })
}

export const getPaymentMethods = async (_req: Request, res: Response) => {
  // Try DB first; fall back to static list if collection is empty (e.g. before seeding)
  const dbMethods = await PaymentMethodModel.find({ is_active: true })
    .sort({ sort_order: 1 })
    .lean<IPaymentMethod[]>()
  if (dbMethods.length > 0) {
    const normalizedMethods = dbMethods.map((m) => ({
      _id: m._id,
      type: m.type,
      name: m.name,
      description: m.description ?? '',
      icon: m.icon ?? '',
      isAvailable: m.is_active,
    }))
    return responseSuccess(res, {
      message: 'Lấy phương thức thanh toán thành công',
      data: normalizedMethods,
    })
  }
  return responseSuccess(res, {
    message: 'Lấy phương thức thanh toán thành công',
    data: orderService.getPaymentMethods(),
  })
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const {
      items,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      coins_used,
      note,
    } = req.body

    const order = await orderService.createOrder(user_id, {
      items,
      shipping_address_id,
      shipping_method_id,
      payment_method,
      voucher_code,
      coins_used,
      note,
      _clientIp: req.ip || (req as any).connection?.remoteAddress || '127.0.0.1',
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

export const getPendingPaymentOrder = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const order = await orderService.getPendingPaymentOrder(user_id)

    return responseSuccess(res, {
      message: order ? 'Tìm thấy đơn hàng chưa thanh toán' : 'Không có đơn hàng chưa thanh toán',
      data: order,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
    }
    throw error
  }
}

/**
 * GET /orders/:id/payment-status
 * Returns current payment status, paymentUrl, canRetry flag, and provider.
 * Rate limited to 20 req/min per user (applied in route).
 */
export const getOrderPaymentStatus = async (req: Request, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const orderId = req.params.id as string

    // Verify the order belongs to this user
    const order = await orderService.getOrderById(user_id, orderId)
    if (!order) {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy đơn hàng')
    }

    const status = await paymentService.getPaymentStatus(orderId)

    return responseSuccess(res, {
      message: 'Lấy trạng thái thanh toán thành công',
      data: status,
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
      { page: Number(page), limit: Number(limit) },
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
  const {
    page,
    limit,
    sort_by,
    order,
    status,
    payment_method,
    user_id,
    search,
    start_date,
    end_date,
  } = req.query as any
  const result = await orderService.adminGetOrders(
    { status, payment_method, user_id, search, start_date, end_date },
    { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, order },
  )
  return responseSuccess(res, {
    message: 'Lấy danh sách đơn hàng thành công',
    data: {
      orders: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.page_size,
      },
    },
  })
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

/**
 * POST /orders/:id/retry-payment
 * Generates a new payment URL for an order whose previous payment failed or expired.
 * Requires the order to belong to the authenticated user.
 */
export const retryOrderPayment = async (req: Req, res: Response) => {
  try {
    const user_id = req.jwtDecoded.id
    const orderId = req.params.id

    // Verify the order belongs to this user before retrying
    const order = await orderService.getOrderById(user_id, orderId)
    if (!order) {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy đơn hàng')
    }

    const clientIp = req.ip || (req as any).connection?.remoteAddress || '127.0.0.1'
    const result = await paymentService.retryPayment(orderId, clientIp)

    return responseSuccess(res, {
      message: 'Tạo lại URL thanh toán thành công',
      data: { paymentUrl: result.paymentUrl, paymentId: result.paymentId },
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
