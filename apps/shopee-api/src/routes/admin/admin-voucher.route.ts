import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminVoucherListSchema,
  adminCreateVoucherSchema,
  adminUpdateVoucherSchema,
  adminVoucherIdSchema,
  adminVoucherUsageSchema,
} from '@schemas/admin-voucher.schema'
import * as ctrl from '@controllers/admin-voucher.controller'

const adminVoucherRouter = Router()

adminVoucherRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminVoucherRouter.get('/', validate(adminVoucherListSchema), asyncHandler(ctrl.adminGetVouchers))
adminVoucherRouter.get('/stats', asyncHandler(ctrl.adminGetVoucherStats))
adminVoucherRouter.get(
  '/:id',
  validate(adminVoucherIdSchema),
  asyncHandler(ctrl.adminGetVoucherById),
)
adminVoucherRouter.get(
  '/:id/usage',
  validate(adminVoucherUsageSchema),
  asyncHandler(ctrl.adminGetVoucherUsage),
)
adminVoucherRouter.post(
  '/',
  validate(adminCreateVoucherSchema),
  asyncHandler(ctrl.adminCreateVoucher),
)
adminVoucherRouter.put(
  '/:id',
  validate(adminUpdateVoucherSchema),
  asyncHandler(ctrl.adminUpdateVoucher),
)
adminVoucherRouter.delete(
  '/:id',
  validate(adminVoucherIdSchema),
  asyncHandler(ctrl.adminDeleteVoucher),
)
adminVoucherRouter.patch(
  '/:id/toggle',
  validate(adminVoucherIdSchema),
  asyncHandler(ctrl.adminToggleVoucher),
)

export default adminVoucherRouter
