/**
 * Admin import routes — refactored to use AdminImportController.
 * The old inline handler in admin-import.route.ts has been replaced by this file.
 */
import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import adminImportController from '@controllers/admin-import.controller'

const adminImportRouter = Router()

// POST /admin/import/products — file upload via multipart/form-data
// importProducts handles multer internally (cannot use asyncHandler wrapper for multer callbacks)
adminImportRouter.post(
  '/products',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  adminImportController.importProducts,
)

// GET /admin/import/products/stats
adminImportRouter.get(
  '/products/stats',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminImportController.getImportStats),
)

export default adminImportRouter
