import { Router } from 'express'
import categoryController from '@controllers/category.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, getCategorySchema, categoryIdParamSchema } from '@schemas/index'

const commonCategoryRouter = Router()
commonCategoryRouter.get(
  '/',
  validate(getCategorySchema),
  asyncHandler(categoryController.getCategories),
)
commonCategoryRouter.get(
  '/:category_id',
  validate(categoryIdParamSchema),
  asyncHandler(categoryController.getCategory),
)
export default commonCategoryRouter
