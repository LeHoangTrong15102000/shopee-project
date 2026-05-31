import { Router, Request, Response } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { pageSlugParamSchema } from '@schemas/page.schema'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { NotFoundError, ValidationError } from '@services/base.service'

const pagesRouter = Router()

const handleError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  throw error
}

// ─── GET /pages/homepage ──────────────────────────────────────────────────────
// Must be registered before /:slug to avoid 'homepage' being treated as a slug param

pagesRouter.get(
  '/homepage',
  asyncHandler(async (_req: Request, res: Response) => {
    const { cmsService } = await import('../../container')
    try {
      const page = await cmsService.getPageBySlug('homepage')
      if (!page || page.status !== 'published') {
        throw new ErrorHandler(STATUS.NOT_FOUND, 'Page not found')
      }
      const resolvedBlocks = await cmsService.resolveBlocks(page.blocks)
      return responseSuccess(res, {
        message: 'Page retrieved successfully',
        data: { ...page, blocks: resolvedBlocks },
      })
    } catch (error) {
      handleError(error)
    }
  }),
)

// ─── GET /pages/:slug ─────────────────────────────────────────────────────────

pagesRouter.get(
  '/:slug',
  validate(pageSlugParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { cmsService } = await import('../../container')
    try {
      const page = await cmsService.getPageBySlug(req.params.slug as string)
      if (!page || page.status !== 'published') {
        throw new ErrorHandler(STATUS.NOT_FOUND, 'Page not found')
      }
      const resolvedBlocks = await cmsService.resolveBlocks(page.blocks)
      return responseSuccess(res, {
        message: 'Page retrieved successfully',
        data: { ...page, blocks: resolvedBlocks },
      })
    } catch (error) {
      handleError(error)
    }
  }),
)

export default pagesRouter
