import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminLowStockSchema,
  adminOutOfStockSchema,
  adminUpdateStockSchema,
  adminBulkStockUpdateSchema,
} from '@schemas/admin-inventory.schema'
import * as ctrl from '@controllers/admin-inventory.controller'

const adminInventoryRouter = Router()

adminInventoryRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminInventoryRouter.get(
  '/low-stock',
  validate(adminLowStockSchema),
  asyncHandler(ctrl.adminGetLowStock),
)
adminInventoryRouter.get(
  '/out-of-stock',
  validate(adminOutOfStockSchema),
  asyncHandler(ctrl.adminGetOutOfStock),
)
adminInventoryRouter.put(
  '/:product_id/stock',
  validate(adminUpdateStockSchema),
  asyncHandler(ctrl.adminUpdateStock),
)
adminInventoryRouter.put(
  '/bulk-stock',
  validate(adminBulkStockUpdateSchema),
  asyncHandler(ctrl.adminBulkUpdateStock),
)

export default adminInventoryRouter
