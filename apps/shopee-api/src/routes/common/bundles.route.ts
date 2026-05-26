import { Router, Request, Response } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

export const bundleRouter = Router()

/**
 * GET /bundles
 * Returns all active, non-expired bundles.
 */
bundleRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const bundles = await container.services.bundle.getActiveBundles()

    responseSuccess(res, {
      message: 'Bundles retrieved',
      data: bundles,
    })
  }),
)

/**
 * GET /bundles/:id
 * Returns a single bundle by ID.
 */
bundleRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const bundleId = req.params.id as string
    const bundle = await container.services.bundle.getBundleById(bundleId)

    responseSuccess(res, {
      message: 'Bundle retrieved',
      data: bundle,
    })
  }),
)
