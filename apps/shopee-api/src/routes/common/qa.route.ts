import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as qaController from '@controllers/qa.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getQuestionsSchema,
  askQuestionSchema,
  answerQuestionSchema,
  likeQuestionSchema,
  likeAnswerSchema,
} from '@schemas/index'

const qaRouter = Router()

// GET /qa/questions - Public (optional auth for like status)
qaRouter.get(
  '/questions',
  validate(getQuestionsSchema),
  authMiddleware.verifyAccessTokenOptional,
  asyncHandler(qaController.getQuestions)
)

// POST /qa/questions - Requires auth
qaRouter.post(
  '/questions',
  validate(askQuestionSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(qaController.askQuestion)
)

// POST /qa/questions/:questionId/answers - Requires auth
qaRouter.post(
  '/questions/:questionId/answers',
  validate(answerQuestionSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(qaController.answerQuestion)
)

// POST /qa/questions/:questionId/like - Requires auth
qaRouter.post(
  '/questions/:questionId/like',
  validate(likeQuestionSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(qaController.likeQuestion)
)

// POST /qa/questions/:questionId/answers/:answerId/like - Requires auth
qaRouter.post(
  '/questions/:questionId/answers/:answerId/like',
  validate(likeAnswerSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(qaController.likeAnswer)
)

export default qaRouter

