import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as priceController from '@controllers/price.controller'
import { asyncHandler } from '@utils/async-handler'

export const userPriceRouter = Router()

// Lấy lịch sử giá sản phẩm (public)
userPriceRouter.get(
  '/products/:productId/price-history',
  asyncHandler(priceController.getPriceHistory),
)

// Lấy danh sách cảnh báo giá (yêu cầu đăng nhập)
userPriceRouter.get(
  '/price-alerts',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.getPriceAlerts),
)

// Tạo cảnh báo giá (yêu cầu đăng nhập)
userPriceRouter.post(
  '/price-alerts',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.createPriceAlert),
)

// Xóa cảnh báo giá (yêu cầu đăng nhập)
userPriceRouter.delete(
  '/price-alerts/:alertId',
  authMiddleware.verifyAccessToken,
  asyncHandler(priceController.deletePriceAlert),
)
