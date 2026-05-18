import { Router } from 'express'
import userController from '@controllers/user.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate, addUserSchema, updateUserSchema, userIdParamSchema } from '@schemas/index'
import { withAuditLog } from '@utils/audit-log.wrapper'
import { UserModel } from '@database/models/user.model'

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
  asyncHandler(withAuditLog(userController.addUser, {
    action: 'user.create',
    resource: 'user',
    getResourceId: (_req, result: any) => result?.data?._id?.toString() ?? null,
  })),
)
adminUserRouter.put(
  '/:user_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(userIdParamSchema),
  validate(updateUserSchema),
  asyncHandler(withAuditLog(userController.updateUser, {
    action: 'user.update',
    resource: 'user',
    getResourceId: (req) => req.params.user_id,
    getBeforeSnapshot: async (req) => UserModel.findById(req.params.user_id).lean() as Promise<Record<string, unknown> | null>,
    getAfterSnapshot: async (req) => UserModel.findById(req.params.user_id).lean() as Promise<Record<string, unknown> | null>,
  })),
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
  asyncHandler(withAuditLog(userController.deleteUser, {
    action: 'user.delete',
    resource: 'user',
    getResourceId: (req) => req.params.user_id,
    getBeforeSnapshot: async (req) => UserModel.findById(req.params.user_id).lean() as Promise<Record<string, unknown> | null>,
  })),
)
export default adminUserRouter
