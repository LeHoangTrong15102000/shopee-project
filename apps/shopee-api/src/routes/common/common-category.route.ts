import { Router } from 'express'
import categoryController from '@controllers/category.controller'
import { wrapAsync } from '@utils/response'
import { validate, getCategorySchema, categoryIdParamSchema } from '@schemas/index'

const commonCategoryRouter = Router()
commonCategoryRouter.get(
  '/',
  validate(getCategorySchema),
  wrapAsync(categoryController.getCategories)
)
commonCategoryRouter.get(
  '/:category_id',
  validate(categoryIdParamSchema),
  wrapAsync(categoryController.getCategory)
)
export default commonCategoryRouter
