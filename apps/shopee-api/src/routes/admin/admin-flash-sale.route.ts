import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  createFlashSaleSchema,
  updateFlashSaleSchema,
  listFlashSalesSchema,
  flashSaleIdParamSchema,
} from '@schemas/flash-sale.schema'
import * as ctrl from '@controllers/admin-flash-sale.controller'
import { withAuditLog } from '@utils/audit-log.wrapper'
import { FlashSaleModel } from '@database/models/flash-sale.model'

const adminFlashSaleRouter = Router()

adminFlashSaleRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

// Read-only routes
adminFlashSaleRouter.get(
  '/',
  validate(listFlashSalesSchema),
  asyncHandler(ctrl.adminListFlashSales),
)

adminFlashSaleRouter.get(
  '/:id',
  validate(flashSaleIdParamSchema),
  asyncHandler(ctrl.adminGetFlashSaleById),
)

adminFlashSaleRouter.get(
  '/:id/stats',
  validate(flashSaleIdParamSchema),
  asyncHandler(ctrl.adminGetFlashSaleStats),
)

// Mutating routes — wrapped with withAuditLog
adminFlashSaleRouter.post(
  '/',
  validate(createFlashSaleSchema),
  asyncHandler(
    withAuditLog(ctrl.adminCreateFlashSale, {
      action: 'flash_sale.create',
      resource: 'flash-sale',
      getResourceId: (_req, result: any) => result?.data?._id?.toString() ?? null,
    }),
  ),
)

adminFlashSaleRouter.put(
  '/:id',
  validate(updateFlashSaleSchema),
  asyncHandler(
    withAuditLog(ctrl.adminUpdateFlashSale, {
      action: 'flash_sale.update',
      resource: 'flash-sale',
      getResourceId: (req) => req.params.id,
      getBeforeSnapshot: async (req) =>
        FlashSaleModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
      getAfterSnapshot: async (req) =>
        FlashSaleModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
    }),
  ),
)

adminFlashSaleRouter.delete(
  '/:id',
  validate(flashSaleIdParamSchema),
  asyncHandler(
    withAuditLog(ctrl.adminDeleteFlashSale, {
      action: 'flash_sale.delete',
      resource: 'flash-sale',
      getResourceId: (req) => req.params.id,
      getBeforeSnapshot: async (req) =>
        FlashSaleModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
    }),
  ),
)

adminFlashSaleRouter.post(
  '/:id/activate',
  validate(flashSaleIdParamSchema),
  asyncHandler(
    withAuditLog(ctrl.adminActivateFlashSale, {
      action: 'flash_sale.activate',
      resource: 'flash-sale',
      getResourceId: (req) => req.params.id,
    }),
  ),
)

adminFlashSaleRouter.post(
  '/:id/deactivate',
  validate(flashSaleIdParamSchema),
  asyncHandler(
    withAuditLog(ctrl.adminDeactivateFlashSale, {
      action: 'flash_sale.deactivate',
      resource: 'flash-sale',
      getResourceId: (req) => req.params.id,
    }),
  ),
)

export default adminFlashSaleRouter
