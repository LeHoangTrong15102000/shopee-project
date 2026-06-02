import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { PaymentMethodModel } from '@database/models/payment-method.model'
import { OrderModel } from '@database/models/order.model'
import type {
  AdminCreatePaymentBody,
  AdminUpdatePaymentBody,
  AdminReorderPaymentBody,
} from '@schemas/admin-payment.schema'

// ─── List all payment methods (admin — includes inactive) ─────────

export const adminGetPaymentMethods = async (_req: Request, res: Response) => {
  const methods = await PaymentMethodModel.find().sort({ sort_order: 1 }).lean()
  return responseSuccess(res, {
    message: 'Lấy danh sách phương thức thanh toán thành công',
    data: methods,
  })
}

// ─── Get single payment method ────────────────────────────────────

export const adminGetPaymentMethodById = async (req: Request, res: Response) => {
  const method = await PaymentMethodModel.findById(req.params.id).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức thanh toán')
  return responseSuccess(res, {
    message: 'Lấy chi tiết phương thức thanh toán thành công',
    data: method,
  })
}

// ─── Create payment method ────────────────────────────────────────

export const adminCreatePaymentMethod = async (req: Request, res: Response) => {
  const body = req.body as AdminCreatePaymentBody
  const method = await PaymentMethodModel.create(body)
  return responseSuccess(res, { message: 'Tạo phương thức thanh toán thành công', data: method })
}

// ─── Update payment method ────────────────────────────────────────

export const adminUpdatePaymentMethod = async (req: Request, res: Response) => {
  const body = req.body as AdminUpdatePaymentBody
  const method = await PaymentMethodModel.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true, runValidators: true },
  ).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức thanh toán')
  return responseSuccess(res, {
    message: 'Cập nhật phương thức thanh toán thành công',
    data: method,
  })
}

// ─── Delete payment method ────────────────────────────────────────

export const adminDeletePaymentMethod = async (req: Request, res: Response) => {
  const method = await PaymentMethodModel.findById(req.params.id).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức thanh toán')

  // Check if referenced by any orders (payment_method field stores the type value)
  const orderCount = await OrderModel.countDocuments({ payment_method: method.type })
  if (orderCount > 0) {
    throw new ErrorHandler(
      STATUS.BAD_REQUEST,
      `Không thể xóa phương thức thanh toán này vì đang được sử dụng trong ${orderCount} đơn hàng. Hãy vô hiệu hóa thay vì xóa.`,
    )
  }

  await PaymentMethodModel.findByIdAndDelete(req.params.id)
  return responseSuccess(res, { message: 'Xóa phương thức thanh toán thành công' })
}

// ─── Toggle is_active ─────────────────────────────────────────────

export const adminTogglePaymentMethod = async (req: Request, res: Response) => {
  const method = await PaymentMethodModel.findById(req.params.id)
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức thanh toán')
  method.is_active = !method.is_active
  await method.save()
  return responseSuccess(res, {
    message: 'Cập nhật trạng thái phương thức thanh toán thành công',
    data: method,
  })
}

// ─── Reorder payment methods ──────────────────────────────────────

export const adminReorderPaymentMethods = async (req: Request, res: Response) => {
  const { items } = req.body as AdminReorderPaymentBody
  await Promise.all(
    items.map((item) =>
      PaymentMethodModel.findByIdAndUpdate(item.id, { $set: { sort_order: item.sort_order } }),
    ),
  )
  return responseSuccess(res, { message: 'Cập nhật thứ tự phương thức thanh toán thành công' })
}
