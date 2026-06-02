import { Router, Request, Response } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  featureFlagIdParamSchema,
} from '@schemas/feature-flag.schema'
import { withAuditLog } from '@utils/audit-log.wrapper'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { FeatureFlagModel } from '@database/models/feature-flag.model'
import { NotFoundError, ConflictError, ValidationError } from '@services/base.service'

const adminFeatureFlagsRouter = Router()

adminFeatureFlagsRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

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

// ─── GET /admin/feature-flags ─────────────────────────────────────────────────

adminFeatureFlagsRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const { featureFlagService } = await import('../../container')
    try {
      const data = await featureFlagService.listFlags()
      return responseSuccess(res, { message: 'Feature flags retrieved successfully', data })
    } catch (error) {
      handleError(error)
    }
  }),
)

// ─── GET /admin/feature-flags/:id ────────────────────────────────────────────

adminFeatureFlagsRouter.get(
  '/:id',
  validate(featureFlagIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { featureFlagService } = await import('../../container')
    try {
      const data = await featureFlagService.getFlag(req.params.id as string)
      return responseSuccess(res, { message: 'Feature flag retrieved successfully', data })
    } catch (error) {
      handleError(error)
    }
  }),
)

// ─── POST /admin/feature-flags ────────────────────────────────────────────────

adminFeatureFlagsRouter.post(
  '/',
  validate(createFeatureFlagSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { featureFlagService } = await import('../../container')
        try {
          const data = await featureFlagService.createFlag(req.body)
          res.status(STATUS.CREATED).send({ message: 'Feature flag created successfully', data })
          return data
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'feature_flag.create',
        resource: 'feature-flag',
        getResourceId: (_req, result: unknown) => {
          const r = result as { _id?: { toString(): string } } | null
          return r?._id?.toString() ?? null
        },
      },
    ),
  ),
)

// ─── PUT /admin/feature-flags/:id ────────────────────────────────────────────

adminFeatureFlagsRouter.put(
  '/:id',
  validate(updateFeatureFlagSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { featureFlagService } = await import('../../container')
        try {
          const data = await featureFlagService.updateFlag(req.params.id as string, req.body)
          return responseSuccess(res, { message: 'Feature flag updated successfully', data })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'feature_flag.update',
        resource: 'feature-flag',
        getResourceId: (req) => req.params.id,
        getBeforeSnapshot: async (req) =>
          FeatureFlagModel.findById(req.params.id).lean() as Promise<Record<
            string,
            unknown
          > | null>,
        getAfterSnapshot: async (req) =>
          FeatureFlagModel.findById(req.params.id).lean() as Promise<Record<
            string,
            unknown
          > | null>,
      },
    ),
  ),
)

// ─── DELETE /admin/feature-flags/:id ─────────────────────────────────────────

adminFeatureFlagsRouter.delete(
  '/:id',
  validate(featureFlagIdParamSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { featureFlagService } = await import('../../container')
        try {
          await featureFlagService.deleteFlag(req.params.id as string)
          return responseSuccess(res, { message: 'Feature flag deleted successfully' })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'feature_flag.delete',
        resource: 'feature-flag',
        getResourceId: (req) => req.params.id,
        getBeforeSnapshot: async (req) =>
          FeatureFlagModel.findById(req.params.id).lean() as Promise<Record<
            string,
            unknown
          > | null>,
      },
    ),
  ),
)

// ─── PATCH /admin/feature-flags/:id/toggle ───────────────────────────────────

adminFeatureFlagsRouter.patch(
  '/:id/toggle',
  validate(featureFlagIdParamSchema),
  asyncHandler(
    withAuditLog(
      async (req: Request, res: Response) => {
        const { featureFlagService } = await import('../../container')
        try {
          const data = await featureFlagService.toggleFlag(req.params.id as string)
          return responseSuccess(res, { message: 'Feature flag toggled successfully', data })
        } catch (error) {
          handleError(error)
        }
      },
      {
        action: 'feature_flag.toggle',
        resource: 'feature-flag',
        getResourceId: (req) => req.params.id,
        getBeforeSnapshot: async (req) =>
          FeatureFlagModel.findById(req.params.id).lean() as Promise<Record<
            string,
            unknown
          > | null>,
        getAfterSnapshot: async (req) =>
          FeatureFlagModel.findById(req.params.id).lean() as Promise<Record<
            string,
            unknown
          > | null>,
      },
    ),
  ),
)

export default adminFeatureFlagsRouter
