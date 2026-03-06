import { Router } from 'express'
import * as priceController from '@controllers/price.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, priceProductIdParamSchema } from '@schemas/index'

const commonPriceRouter = Router()

// Lấy lịch sử giá của sản phẩm
commonPriceRouter.get(
  '/:productId/price-history',
  validate(priceProductIdParamSchema),
  asyncHandler(priceController.getPriceHistory)
)

export default commonPriceRouter

