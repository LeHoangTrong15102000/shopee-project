import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminShippingIdSchema,
  adminCreateShippingSchema,
  adminUpdateShippingSchema,
  adminReorderShippingSchema,
} from '@schemas/admin-shipping.schema'
import * as ctrl from '@controllers/admin-shipping.controller'

const adminShippingRouter = Router()

adminShippingRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

// PUT /reorder must come BEFORE /:id to avoid 'reorder' being treated as an id param
adminShippingRouter.put(
  '/reorder',
  validate(adminReorderShippingSchema),
  asyncHandler(ctrl.adminReorderShippingMethods),
)

adminShippingRouter.get('/', asyncHandler(ctrl.adminGetShippingMethods))
adminShippingRouter.get(
  '/:id',
  validate(adminShippingIdSchema),
  asyncHandler(ctrl.adminGetShippingMethodById),
)
adminShippingRouter.post(
  '/',
  validate(adminCreateShippingSchema),
  asyncHandler(ctrl.adminCreateShippingMethod),
)
adminShippingRouter.put(
  '/:id',
  validate(adminUpdateShippingSchema),
  asyncHandler(ctrl.adminUpdateShippingMethod),
)
adminShippingRouter.delete(
  '/:id',
  validate(adminShippingIdSchema),
  asyncHandler(ctrl.adminDeleteShippingMethod),
)
adminShippingRouter.patch(
  '/:id/toggle',
  validate(adminShippingIdSchema),
  asyncHandler(ctrl.adminToggleShippingMethod),
)

export default adminShippingRouter
