import { Router } from 'express'
import { Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { WishlistAnalyticsService } from '@services/wishlist-analytics.service'
import { STATUS } from '@constants/status'

const adminWishlistRouter = Router()
const wishlistAnalyticsService = new WishlistAnalyticsService()

// GET /admin/wishlist/analytics/top-products
adminWishlistRouter.get(
  '/analytics/top-products',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || '30d'
    const { products, total } = await wishlistAnalyticsService.getTopProducts(period)
    res.status(STATUS.OK).json({
      message: 'Top wishlisted products',
      data: { products, total, period },
    })
  }),
)

// GET /admin/wishlist/analytics/conversion
adminWishlistRouter.get(
  '/analytics/conversion',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await wishlistAnalyticsService.getConversion()
    res.status(STATUS.OK).json({ message: 'Wishlist conversion data', data: { items: data } })
  }),
)

// GET /admin/wishlist/analytics/trends
adminWishlistRouter.get(
  '/analytics/trends',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || '30d'
    const trends = await wishlistAnalyticsService.getTrends(period)
    res.status(STATUS.OK).json({
      message: 'Wishlist trends data',
      data: { trends, period },
    })
  }),
)

export default adminWishlistRouter
