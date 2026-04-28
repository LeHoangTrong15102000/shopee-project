import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import authMiddleware from '@middleware/auth.middleware'
import * as shopController from '@controllers/shop.controller'

export const shopRouter = Router()

// GET /shops/:id — public, but includes isFollowing if authenticated
shopRouter.get('/:id', asyncHandler(shopController.getShop))

// GET /shops/:id/products — public
shopRouter.get('/:id/products', asyncHandler(shopController.getShopProducts))

// POST /shops/:id/follow — authenticated
shopRouter.post('/:id/follow', authMiddleware.verifyAccessToken, asyncHandler(shopController.followShop))

// DELETE /shops/:id/follow — authenticated
shopRouter.delete('/:id/follow', authMiddleware.verifyAccessToken, asyncHandler(shopController.unfollowShop))
