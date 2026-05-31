import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  createPageSchema,
  updatePageSchema,
  listPagesSchema,
  pageIdParamSchema,
} from '@schemas/page.schema'
import { withAuditLog } from '@utils/audit-log.wrapper'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { PageModel } from '@database/models/page.model'
import { NotFoundError, ConflictError, ValidationError } from '@services/base.service'

const adminPagesRouter = Router()

adminPagesRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

const handleError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, error.message)
  }
  if (error instanceof NotFoundError) {
    throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
  }
  if (error instanceof ConflictError) {
    throw new ErrorHandler(409, error.message)
  }
  throw error
}

// ─── GET /admin/pages ─────────────────────────────────────────────────────────

adminPagesRouter.get(
  '/',
  validate(listPagesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { cmsService } = await import('../../container')
    try {
      const { status } = req.query as { status?: 'draft' | 'published' }
      const data = await cmsService.listPages(status ? { status } : undefined)
      return responseSuccess(res, { message: 'Pages retrieved successfully', data })
    } catch (error) {
      handleError(error)
    }
  }),
)

// ─── GET /admin/pages/:id ─────────────────────────────────────────────────────

adminPagesRouter.get(
  '/:id',
  validate(pageIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { cmsService } = await import('../../container')
    try {
      const data = await cmsService.getPage(req.params.id as string)
      return responseSuccess(res, { message: 'Page retrieved successfully', data })
    } catch (error) {
      handleError(error)
    }
  }),
)

// ─── POST /admin/pages ────────────────────────────────────────────────────────

adminPagesRouter.post(
  '/',
  validate(createPageSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { cmsService } = await import('../../container')
        try {
          const data = await cmsService.createPage(req.body)
          res.status(STATUS.CREATED).send({ message: 'Page created successfully', data })
          return data
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'page.create',
        resource: 'page',
        getResourceId: (_req, result: unknown) => {
          const r = result as { _id?: { toString(): string } } | null
          return r?._id?.toString() ?? null
        },
      },
    ),
  ),
)

// ─── PUT /admin/pages/:id ─────────────────────────────────────────────────────

adminPagesRouter.put(
  '/:id',
  validate(updatePageSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { cmsService } = await import('../../container')
        try {
          const data = await cmsService.updatePage(req.params.id as string, req.body)
          return responseSuccess(res, { message: 'Page updated successfully', data })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'page.update',
        resource: 'page',
        getResourceId: (req) => req.params.id,
        getBeforeSnapshot: async (req) =>
          PageModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
        getAfterSnapshot: async (req) =>
          PageModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
      },
    ),
  ),
)

// ─── DELETE /admin/pages/:id ──────────────────────────────────────────────────

adminPagesRouter.delete(
  '/:id',
  validate(pageIdParamSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { cmsService } = await import('../../container')
        try {
          await cmsService.deletePage(req.params.id as string)
          return responseSuccess(res, { message: 'Page deleted successfully' })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'page.delete',
        resource: 'page',
        getResourceId: (req) => req.params.id,
        getBeforeSnapshot: async (req) =>
          PageModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
      },
    ),
  ),
)

// ─── PATCH /admin/pages/:id/publish ──────────────────────────────────────────

adminPagesRouter.patch(
  '/:id/publish',
  validate(pageIdParamSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { cmsService } = await import('../../container')
        try {
          const data = await cmsService.publishPage(req.params.id as string)
          return responseSuccess(res, { message: 'Page published successfully', data })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'page.publish',
        resource: 'page',
        getResourceId: (req) => req.params.id,
      },
    ),
  ),
)

// ─── PATCH /admin/pages/:id/unpublish ────────────────────────────────────────

adminPagesRouter.patch(
  '/:id/unpublish',
  validate(pageIdParamSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { cmsService } = await import('../../container')
        try {
          const data = await cmsService.unpublishPage(req.params.id as string)
          return responseSuccess(res, { message: 'Page unpublished successfully', data })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'page.unpublish',
        resource: 'page',
        getResourceId: (req) => req.params.id,
      },
    ),
  ),
)

export default adminPagesRouter
