import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import userController from '@controllers/user.controller'
import { wrapAsync } from '@utils/response'
import { validate, updateMeSchema } from '@schemas/index'

const commonUserRouter = Router()

commonUserRouter.get(
  '/me',
  authMiddleware.verifyAccessToken,
  wrapAsync(userController.getDetailMySelf)
)
commonUserRouter.put(
  '/me',
  authMiddleware.verifyAccessToken,
  validate(updateMeSchema),
  wrapAsync(userController.updateMe)
)
export default commonUserRouter
