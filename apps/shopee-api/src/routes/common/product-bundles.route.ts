import { Router, Request, Response } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { responseSuccess } from '@utils/response'
import { container } from '../../container'

/**
 * Bundle suggestion routes mounted under /products.
 * GET /products/:id/bundles — active bundles that contain the given product.
 */
export const productBundleRouter = Router({ mergeParams: true })

productBundleRouter.get(
  '/:id/bundles',
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string
    const bundles = await container.services.bundle.findApplicableBundles(productId)

    responseSuccess(res, {
      message: 'Bundle suggestions retrieved',
      data: bundles,
    })
  }),
)
