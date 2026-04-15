import { Router } from 'express'
import userController from '@controllers/user.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate, addUserSchema, updateUserSchema, userIdParamSchema } from '@schemas/index'

const adminUserRouter = Router()
adminUserRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(userController.getUsers),
)
adminUserRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(addUserSchema),
  asyncHandler(userController.addUser),
)
adminUserRouter.put(
  '/:user_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(userIdParamSchema),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser),
)
adminUserRouter.get(
  '/:user_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(userIdParamSchema),
  asyncHandler(userController.getUser),
)
adminUserRouter.delete(
  '/delete/:user_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(userIdParamSchema),
  asyncHandler(userController.deleteUser),
)
export default adminUserRouter
