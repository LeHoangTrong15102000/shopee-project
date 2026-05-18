import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { flashSaleIdParamSchema } from '@schemas/flash-sale.schema'
import * as ctrl from '@controllers/flash-sale.controller'

const flashSaleRouter = Router()

// Public endpoints — no auth required
flashSaleRouter.get('/active', asyncHandler(ctrl.getActiveFlashSales))

flashSaleRouter.get('/:id', validate(flashSaleIdParamSchema), asyncHandler(ctrl.getFlashSaleById))

flashSaleRouter.get(
  '/:id/products',
  validate(flashSaleIdParamSchema),
  asyncHandler(ctrl.getFlashSaleProducts),
)

export default flashSaleRouter
