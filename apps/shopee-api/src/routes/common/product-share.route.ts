import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

export const shareRouter = Router()

/**
 * POST /products/:id/share
 * Atomically increments shareCount and returns the share URL.
 * Requires authentication.
 */
shareRouter.post(
  '/:id/share',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string
    const userId = req.jwtDecoded.id
    const userName: string = ((req.jwtDecoded as Record<string, unknown>).name as string) || userId
    const userAvatar: string | undefined = (req.jwtDecoded as Record<string, unknown>).avatar as
      | string
      | undefined

    const result = await container.services.share.shareProduct(
      productId,
      userId,
      userName,
      userAvatar,
    )

    responseSuccess(res, {
      message: 'Product shared successfully',
      data: result,
    })
  }),
)
