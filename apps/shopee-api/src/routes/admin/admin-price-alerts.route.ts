import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import {
  adminGetPriceAlerts,
  adminGetPriceAlertStats,
  adminDeletePriceAlert,
} from '@controllers/admin-price-alerts.controller'

const adminPriceAlertsRouter = Router()

adminPriceAlertsRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminPriceAlertsRouter.get('/', asyncHandler(adminGetPriceAlerts))
adminPriceAlertsRouter.get('/stats', asyncHandler(adminGetPriceAlertStats))
adminPriceAlertsRouter.delete('/:id', asyncHandler(adminDeletePriceAlert))

export default adminPriceAlertsRouter
