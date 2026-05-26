import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess, ValidationError } from '@utils/response'
import { container } from '../../container'

export const referralRouter = Router()

/**
 * GET /referral/my-code
 * Returns the authenticated user's referral code (auto-generates if not present).
 */
referralRouter.get(
  '/my-code',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const referralCode = await container.services.referral.generateCode(userId)

    responseSuccess(res, {
      message: 'Referral code retrieved',
      data: {
        code: referralCode.code,
        usageCount: referralCode.usageCount,
        maxUsages: referralCode.maxUsages,
        isActive: referralCode.isActive,
        expiresAt: referralCode.expiresAt,
      },
    })
  }),
)

/**
 * POST /referral/apply
 * Apply a referral code for the authenticated user.
 * Body: { code: string }
 */
referralRouter.post(
  '/apply',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const { code } = req.body as { code: string }

    if (!code) {
      throw new ValidationError({ code: 'code is required' })
    }

    const reward = await container.services.referral.applyCode(userId, code)

    responseSuccess(res, {
      message: 'Referral code applied successfully',
      data: {
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        status: reward.status,
      },
    })
  }),
)

/**
 * GET /referral/stats
 * Returns referral stats for the authenticated user.
 */
referralRouter.get(
  '/stats',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.jwtDecoded.id
    const stats = await container.services.referral.getStats(userId)

    responseSuccess(res, {
      message: 'Referral stats retrieved',
      data: stats,
    })
  }),
)
