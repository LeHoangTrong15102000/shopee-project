import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import categoryController from '@controllers/category.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  addCategorySchema,
  updateCategorySchema,
  getCategorySchema,
  categoryIdParamSchema,
} from '@schemas/index'

const adminCategoryRouter = Router()
adminCategoryRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(getCategorySchema),
  asyncHandler(categoryController.getCategories),
)
adminCategoryRouter.get(
  '/:category_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(categoryIdParamSchema),
  asyncHandler(categoryController.getCategory),
)
adminCategoryRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(addCategorySchema),
  asyncHandler(categoryController.addCategory),
)
adminCategoryRouter.put(
  '/:category_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(categoryIdParamSchema.merge(updateCategorySchema)),
  asyncHandler(categoryController.updateCategory),
)
adminCategoryRouter.delete(
  '/delete/:category_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(categoryIdParamSchema),
  asyncHandler(categoryController.deleteCategory),
)
export default adminCategoryRouter
