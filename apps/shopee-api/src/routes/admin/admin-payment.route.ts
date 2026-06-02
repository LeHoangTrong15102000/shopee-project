import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminPaymentIdSchema,
  adminCreatePaymentSchema,
  adminUpdatePaymentSchema,
  adminReorderPaymentSchema,
} from '@schemas/admin-payment.schema'
import * as ctrl from '@controllers/admin-payment.controller'

const adminPaymentRouter = Router()

adminPaymentRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

// PUT /reorder must come BEFORE /:id to avoid 'reorder' being treated as an id param
adminPaymentRouter.put(
  '/reorder',
  validate(adminReorderPaymentSchema),
  asyncHandler(ctrl.adminReorderPaymentMethods),
)

adminPaymentRouter.get('/', asyncHandler(ctrl.adminGetPaymentMethods))
adminPaymentRouter.get(
  '/:id',
  validate(adminPaymentIdSchema),
  asyncHandler(ctrl.adminGetPaymentMethodById),
)
adminPaymentRouter.post(
  '/',
  validate(adminCreatePaymentSchema),
  asyncHandler(ctrl.adminCreatePaymentMethod),
)
adminPaymentRouter.put(
  '/:id',
  validate(adminUpdatePaymentSchema),
  asyncHandler(ctrl.adminUpdatePaymentMethod),
)
adminPaymentRouter.delete(
  '/:id',
  validate(adminPaymentIdSchema),
  asyncHandler(ctrl.adminDeletePaymentMethod),
)
adminPaymentRouter.patch(
  '/:id/toggle',
  validate(adminPaymentIdSchema),
  asyncHandler(ctrl.adminTogglePaymentMethod),
)

export default adminPaymentRouter
