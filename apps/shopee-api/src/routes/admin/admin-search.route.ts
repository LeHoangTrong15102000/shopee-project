/**
 * Admin search routes — reindex endpoint.
 *
 * POST /admin/search/reindex — trigger full Meilisearch reindex (admin only)
 */
import { Router } from 'express'
import { adminSearchController } from '@controllers/admin-search.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'

const adminSearchRouter = Router()

/**
 * POST /admin/search/reindex
 * Enqueues a BullMQ job to reindex all products into Meilisearch.
 * Returns 202 Accepted immediately.
 */
adminSearchRouter.post(
  '/reindex',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminSearchController.triggerReindex),
)

export default adminSearchRouter
