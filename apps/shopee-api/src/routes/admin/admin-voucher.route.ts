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
import { withAuditLog } from '@utils/audit-log.wrapper'
import { VoucherModel } from '@database/models/voucher.model'

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
  asyncHandler(withAuditLog(ctrl.adminCreateVoucher, {
    action: 'voucher.create',
    resource: 'voucher',
    getResourceId: (_req, result: any) => result?.data?._id?.toString() ?? null,
  })),
)
adminVoucherRouter.put(
  '/:id',
  validate(adminUpdateVoucherSchema),
  asyncHandler(withAuditLog(ctrl.adminUpdateVoucher, {
    action: 'voucher.update',
    resource: 'voucher',
    getResourceId: (req) => req.params.id,
    getBeforeSnapshot: async (req) => VoucherModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
    getAfterSnapshot: async (req) => VoucherModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
  })),
)
adminVoucherRouter.delete(
  '/:id',
  validate(adminVoucherIdSchema),
  asyncHandler(withAuditLog(ctrl.adminDeleteVoucher, {
    action: 'voucher.delete',
    resource: 'voucher',
    getResourceId: (req) => req.params.id,
    getBeforeSnapshot: async (req) => VoucherModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
  })),
)
adminVoucherRouter.patch(
  '/:id/toggle',
  validate(adminVoucherIdSchema),
  asyncHandler(ctrl.adminToggleVoucher),
)

export default adminVoucherRouter
