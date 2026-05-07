import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import {
  adminGetConversations,
  adminGetConversation,
  adminDeleteConversation,
} from '@controllers/admin-conversation.controller'

const adminConversationRouter = Router()

adminConversationRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminConversationRouter.get('/', asyncHandler(adminGetConversations))
adminConversationRouter.get('/:id', asyncHandler(adminGetConversation))
adminConversationRouter.delete('/:id', asyncHandler(adminDeleteConversation))

export default adminConversationRouter
