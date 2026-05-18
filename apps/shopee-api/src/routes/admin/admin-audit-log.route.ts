import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { adminAuditLogListSchema, adminAuditLogIdSchema } from '@schemas/admin-audit-log.schema'
import adminAuditLogController from '@controllers/admin-audit-log.controller'

const adminAuditLogRouter = Router()

adminAuditLogRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

// GET /admin/audit-logs — paginated, filterable list
adminAuditLogRouter.get(
  '/',
  validate(adminAuditLogListSchema),
  asyncHandler(adminAuditLogController.getAuditLogs),
)

// GET /admin/audit-logs/:id — single entry with diff field
adminAuditLogRouter.get(
  '/:id',
  validate(adminAuditLogIdSchema),
  asyncHandler(adminAuditLogController.getAuditLogById),
)

export default adminAuditLogRouter
