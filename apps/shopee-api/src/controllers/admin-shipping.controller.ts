import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { ShippingMethodModel } from '@database/models/shipping-method.model'
import { OrderModel } from '@database/models/order.model'
import type {
  AdminCreateShippingBody,
  AdminUpdateShippingBody,
  AdminReorderShippingBody,
} from '@schemas/admin-shipping.schema'

// ─── List all shipping methods (admin — includes inactive) ────────

export const adminGetShippingMethods = async (_req: Request, res: Response) => {
  const methods = await ShippingMethodModel.find().sort({ sort_order: 1 }).lean()
  return responseSuccess(res, {
    message: 'Lấy danh sách phương thức vận chuyển thành công',
    data: methods,
  })
}

// ─── Get single shipping method ───────────────────────────────────

export const adminGetShippingMethodById = async (req: Request, res: Response) => {
  const method = await ShippingMethodModel.findById(req.params.id).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển')
  return responseSuccess(res, {
    message: 'Lấy chi tiết phương thức vận chuyển thành công',
    data: method,
  })
}

// ─── Create shipping method ───────────────────────────────────────

export const adminCreateShippingMethod = async (req: Request, res: Response) => {
  const body = req.body as AdminCreateShippingBody
  const method = await ShippingMethodModel.create(body)
  return responseSuccess(res, { message: 'Tạo phương thức vận chuyển thành công', data: method })
}

// ─── Update shipping method ───────────────────────────────────────

export const adminUpdateShippingMethod = async (req: Request, res: Response) => {
  const body = req.body as AdminUpdateShippingBody
  const method = await ShippingMethodModel.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true, runValidators: true },
  ).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển')
  return responseSuccess(res, {
    message: 'Cập nhật phương thức vận chuyển thành công',
    data: method,
  })
}

// ─── Delete shipping method ───────────────────────────────────────

export const adminDeleteShippingMethod = async (req: Request, res: Response) => {
  const method = await ShippingMethodModel.findById(req.params.id).lean()
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển')

  // Check if referenced by any orders
  const orderCount = await OrderModel.countDocuments({ 'shipping_method.id': req.params.id })
  if (orderCount > 0) {
    throw new ErrorHandler(
      STATUS.BAD_REQUEST,
      `Không thể xóa phương thức vận chuyển này vì đang được sử dụng trong ${orderCount} đơn hàng. Hãy vô hiệu hóa thay vì xóa.`,
    )
  }

  await ShippingMethodModel.findByIdAndDelete(req.params.id)
  return responseSuccess(res, { message: 'Xóa phương thức vận chuyển thành công' })
}

// ─── Toggle is_active ─────────────────────────────────────────────

export const adminToggleShippingMethod = async (req: Request, res: Response) => {
  const method = await ShippingMethodModel.findById(req.params.id)
  if (!method) throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển')
  method.is_active = !method.is_active
  await method.save()
  return responseSuccess(res, {
    message: 'Cập nhật trạng thái phương thức vận chuyển thành công',
    data: method,
  })
}

// ─── Reorder shipping methods ─────────────────────────────────────

export const adminReorderShippingMethods = async (req: Request, res: Response) => {
  const { items } = req.body as AdminReorderShippingBody
  await Promise.all(
    items.map((item) =>
      ShippingMethodModel.findByIdAndUpdate(item.id, { $set: { sort_order: item.sort_order } }),
    ),
  )
  return responseSuccess(res, { message: 'Cập nhật thứ tự phương thức vận chuyển thành công' })
}
