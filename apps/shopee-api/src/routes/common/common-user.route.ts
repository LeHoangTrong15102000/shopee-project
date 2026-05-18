import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import userController from '@controllers/user.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, updateMeSchema } from '@schemas/index'

const commonUserRouter = Router()

commonUserRouter.get(
  '/me',
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.getDetailMySelf),
)
commonUserRouter.put(
  '/me',
  authMiddleware.verifyAccessToken,
  validate(updateMeSchema),
  asyncHandler(userController.updateMe),
)
commonUserRouter.post(
  '/me/upload-avatar',
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.uploadAvatar),
)
export default commonUserRouter
