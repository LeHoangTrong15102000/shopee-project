import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import authMiddleware from '@middleware/auth.middleware'
import * as shopChatController from '@controllers/shop-chat.controller'

export const shopChatRouter = Router()

// GET /shop-conversations — authenticated; returns Conversation[] sorted by updatedAt desc
shopChatRouter.get(
  '/',
  authMiddleware.verifyAccessToken,
  asyncHandler(shopChatController.getConversations),
)

// POST /shop-conversations — authenticated; body: { shopId }
shopChatRouter.post(
  '/',
  authMiddleware.verifyAccessToken,
  asyncHandler(shopChatController.createOrGetConversation),
)

// GET /shop-conversations/:id/messages — cursor-based pagination
shopChatRouter.get(
  '/:id/messages',
  authMiddleware.verifyAccessToken,
  asyncHandler(shopChatController.getMessages),
)

// POST /shop-conversations/:id/messages — authenticated
shopChatRouter.post(
  '/:id/messages',
  authMiddleware.verifyAccessToken,
  asyncHandler(shopChatController.sendMessage),
)
