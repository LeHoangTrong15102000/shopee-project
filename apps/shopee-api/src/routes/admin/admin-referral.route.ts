import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

const adminReferralRouter = Router()

/**
 * GET /admin/referral/analytics
 * Returns referral system analytics for admins.
 */
adminReferralRouter.get(
  '/analytics',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const analytics = await container.services.referral.getAdminAnalytics()

    responseSuccess(res, {
      message: 'Referral analytics retrieved',
      data: analytics,
    })
  }),
)

export default adminReferralRouter
