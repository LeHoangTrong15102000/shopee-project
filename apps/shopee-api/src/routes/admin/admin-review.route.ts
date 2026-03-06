import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { adminReviewListSchema, adminReviewIdSchema, adminCommentIdSchema } from '@schemas/admin-review.schema'
import * as ctrl from '@controllers/admin-review.controller'

const adminReviewRouter = Router()

adminReviewRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminReviewRouter.get('/', validate(adminReviewListSchema), asyncHandler(ctrl.adminGetReviews))
adminReviewRouter.get('/stats', asyncHandler(ctrl.adminGetReviewStats))
adminReviewRouter.get('/:id', validate(adminReviewIdSchema), asyncHandler(ctrl.adminGetReviewById))
adminReviewRouter.delete('/:id', validate(adminReviewIdSchema), asyncHandler(ctrl.adminDeleteReview))
adminReviewRouter.delete('/comments/:id', validate(adminCommentIdSchema), asyncHandler(ctrl.adminDeleteComment))

export default adminReviewRouter

