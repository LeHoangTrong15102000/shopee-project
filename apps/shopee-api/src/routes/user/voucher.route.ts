import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as voucherController from '@controllers/voucher.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getVouchersSchema,
  getSavedVouchersSchema,
  getVoucherByCodeSchema,
  applyVoucherSchema,
  saveVoucherSchema,
  getAvailableVouchersSchema,
  getMyVouchersSchema,
  collectVoucherSchema,
  validateVoucherSchema,
} from '@schemas/index'

export const userVoucherRouter = Router()

// Lấy danh sách voucher có sẵn (public)
userVoucherRouter.get('', validate(getVouchersSchema), asyncHandler(voucherController.getVouchers))

// Lấy danh sách voucher khả dụng để thu thập (có thể auth để check đã collect chưa)
userVoucherRouter.get(
  '/available',
  validate(getAvailableVouchersSchema),
  authMiddleware.verifyAccessTokenOptional,
  asyncHandler(voucherController.getAvailableVouchers),
)

// Lấy danh sách voucher của user (cần auth)
userVoucherRouter.get(
  '/my-vouchers',
  validate(getMyVouchersSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.getMyVouchers),
)

// Lấy danh sách voucher đã lưu của user (cần auth)
userVoucherRouter.get(
  '/saved',
  validate(getSavedVouchersSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.getSavedVouchers),
)

// Lấy voucher theo code
userVoucherRouter.get(
  '/code/:code',
  validate(getVoucherByCodeSchema),
  asyncHandler(voucherController.getVoucherByCode),
)

// Apply voucher vào đơn hàng (cần auth)
userVoucherRouter.post(
  '/apply',
  validate(applyVoucherSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.applyVoucher),
)

// Validate voucher trước khi checkout (cần auth)
userVoucherRouter.post(
  '/validate',
  validate(validateVoucherSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.validateVoucher),
)

// Thu thập voucher (cần auth)
userVoucherRouter.post(
  '/:id/collect',
  validate(collectVoucherSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.collectVoucher),
)

// Lưu voucher vào tài khoản user (cần auth)
userVoucherRouter.post(
  '/:id/save',
  validate(saveVoucherSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(voucherController.saveVoucher),
)
