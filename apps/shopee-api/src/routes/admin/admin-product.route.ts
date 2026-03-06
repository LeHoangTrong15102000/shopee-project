import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import ProductController from '@controllers/product.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getProductsSchema,
  getAllProductsSchema,
  productIdParamSchema,
  addProductSchema,
  updateProductSchema,
} from '@schemas/index'

const adminProductRouter = Router()
/**
 * [Get products paginate]
 * @queryParam type: string, page: number, limit: number, category:mongoId
 * @route admin/products
 * @method get
 */
adminProductRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(getProductsSchema),
  asyncHandler(ProductController.getProducts)
)
/**
 * [Get all products ]
 * @queryParam type: string, category:mongoId
 * @route admin/products/all
 * @method get
 */
adminProductRouter.get(
  '/all',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(getAllProductsSchema),
  asyncHandler(ProductController.getAllProducts)
)

adminProductRouter.get(
  '/:product_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(productIdParamSchema),
  asyncHandler(ProductController.getProduct)
)
adminProductRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(addProductSchema),
  asyncHandler(ProductController.addProduct)
)
adminProductRouter.put(
  '/:product_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(productIdParamSchema),
  validate(updateProductSchema),
  asyncHandler(ProductController.updateProduct)
)

adminProductRouter.delete(
  '/delete/:product_id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(productIdParamSchema),
  asyncHandler(ProductController.deleteProduct)
)

adminProductRouter.delete(
  '/delete-many',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  // Note: listIdRule validation will be handled in cleanup phase
  asyncHandler(ProductController.deleteManyProducts)
)

adminProductRouter.post(
  '/upload-image',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(ProductController.uploadProductImage)
)
adminProductRouter.post(
  '/upload-images',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(ProductController.uploadManyProductImages)
)
export default adminProductRouter
