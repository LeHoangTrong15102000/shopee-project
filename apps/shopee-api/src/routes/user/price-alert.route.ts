import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as priceController from '@controllers/price.controller'
import { asyncHandler } from '@utils/async-handler'

export const userPriceAlertRouter = Router()

// Lấy danh sách cảnh báo giá
userPriceAlertRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.getPriceAlerts)
)

// Tạo cảnh báo giá
userPriceAlertRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.createPriceAlert)
)

// Xóa cảnh báo giá
userPriceAlertRouter.delete(
  '/:alertId',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.deletePriceAlert)
)

