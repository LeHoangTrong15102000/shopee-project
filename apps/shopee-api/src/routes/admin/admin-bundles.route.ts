import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

const adminBundlesRouter = Router()

/**
 * POST /admin/bundles
 * Create a new bundle deal.
 */
adminBundlesRouter.post(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const bundle = await container.services.bundle.createBundle(req.body)

    res.status(201)
    responseSuccess(res, {
      message: 'Bundle created',
      data: bundle,
    })
  }),
)

/**
 * PUT /admin/bundles/:id
 * Update an existing bundle deal.
 */
adminBundlesRouter.put(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const bundleId = req.params.id as string
    const bundle = await container.services.bundle.updateBundle(bundleId, req.body)

    responseSuccess(res, {
      message: 'Bundle updated',
      data: bundle,
    })
  }),
)

/**
 * DELETE /admin/bundles/:id
 * Soft-delete a bundle deal (sets isActive = false).
 */
adminBundlesRouter.delete(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const bundleId = req.params.id as string
    await container.services.bundle.deleteBundle(bundleId)

    responseSuccess(res, {
      message: 'Bundle deactivated',
      data: null,
    })
  }),
)

export default adminBundlesRouter
