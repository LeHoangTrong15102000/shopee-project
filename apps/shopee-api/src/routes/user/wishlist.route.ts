import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as wishlistController from '@controllers/wishlist.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getWishlistSchema,
  addToWishlistSchema,
  checkInWishlistSchema,
  removeFromWishlistSchema,
} from '@schemas/index'

export const userWishlistRouter = Router()

// Lấy danh sách sản phẩm yêu thích
userWishlistRouter.get(
  '',
  validate(getWishlistSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.getWishlist),
)

// Lấy số lượng sản phẩm trong wishlist
userWishlistRouter.get(
  '/count',
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.getWishlistCount),
)

// Kiểm tra sản phẩm có trong wishlist không
userWishlistRouter.get(
  '/check/:product_id',
  validate(checkInWishlistSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.checkInWishlist),
)

// Thêm sản phẩm vào wishlist
userWishlistRouter.post(
  '',
  validate(addToWishlistSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.addToWishlist),
)

// Xóa toàn bộ wishlist
userWishlistRouter.delete(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.clearWishlist),
)

// Xóa sản phẩm khỏi wishlist
userWishlistRouter.delete(
  '/:product_id',
  validate(removeFromWishlistSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(wishlistController.removeFromWishlist),
)
