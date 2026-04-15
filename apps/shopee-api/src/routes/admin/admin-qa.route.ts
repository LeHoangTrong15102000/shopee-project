import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminQuestionListSchema,
  adminQuestionIdSchema,
  adminDeleteAnswerSchema,
} from '@schemas/admin-qa.schema'
import * as ctrl from '@controllers/admin-qa.controller'

const adminQARouter = Router()

adminQARouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminQARouter.get(
  '/questions',
  validate(adminQuestionListSchema),
  asyncHandler(ctrl.adminGetQuestions),
)
adminQARouter.get('/stats', asyncHandler(ctrl.adminGetQAStats))
adminQARouter.delete(
  '/questions/:id',
  validate(adminQuestionIdSchema),
  asyncHandler(ctrl.adminDeleteQuestion),
)
adminQARouter.delete(
  '/questions/:question_id/answers/:answer_id',
  validate(adminDeleteAnswerSchema),
  asyncHandler(ctrl.adminDeleteAnswer),
)

export default adminQARouter
