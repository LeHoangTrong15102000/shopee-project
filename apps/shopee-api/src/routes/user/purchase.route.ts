import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as purchaseController from '@controllers/purchase.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  buyProductsSchema,
  addToCartSchema,
  updatePurchaseSchema,
  deletePurchasesSchema,
} from '@schemas/index'

export const userPurchaseRouter = Router()

userPurchaseRouter.post(
  '/buy-products',
  validate(buyProductsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(purchaseController.buyProducts)
)

userPurchaseRouter.post(
  '/add-to-cart',
  validate(addToCartSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(purchaseController.addToCart)
)

userPurchaseRouter.put(
  '/update-purchase',
  validate(updatePurchaseSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(purchaseController.updatePurchase)
)

userPurchaseRouter.delete(
  '',
  validate(deletePurchasesSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(purchaseController.deletePurchases)
)

userPurchaseRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(purchaseController.getPurchases)
)
