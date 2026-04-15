import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import userController from '@controllers/user.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, updateMeSchema } from '@schemas/index'

export const userUserRouter = Router()
userUserRouter.put(
  '',
  validate(updateMeSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.updateMe),
)
userUserRouter.post(
  '/upload-avatar',
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.uploadAvatar),
)

userUserRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.getDetailMySelf),
)
