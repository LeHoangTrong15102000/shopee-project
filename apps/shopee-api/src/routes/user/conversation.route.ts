import * as express from 'express'
import { conversationController } from '@controllers/conversation.controller'
import { asyncHandler } from '@utils/async-handler'
import { rateLimitConfigs } from '@middleware/rateLimiter.middleware'
import authMiddleware from '@middleware/auth.middleware'
import {
  validate,
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
  getConversationsSchema,
  testChatbotSchema,
  conversationIdParamSchema,
} from '@schemas/index'

const conversationRouter = express.Router()

/**
 * Lấy danh sách conversations của user
 * GET /conversations?page=1&limit=10&status=active
 */
conversationRouter.get(
  '/',
  rateLimitConfigs.conversation,
  validate(getConversationsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.getConversations),
)

/**
 * Tạo conversation mới
 * POST /conversations
 * Body: { message: string, title?: string }
 */
conversationRouter.post(
  '/',
  rateLimitConfigs.conversation,
  validate(createConversationSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.createConversation),
)

/**
 * Test chatbot (không cần authentication để test)
 * POST /conversations/test
 * Body: { message: string }
 */
conversationRouter.post(
  '/test',
  rateLimitConfigs.testChatbot,
  validate(testChatbotSchema),
  asyncHandler(conversationController.testChatbot),
)

/**
 * Test chatbot streaming (không cần authentication để test)
 * GET /conversations/test-stream?message=hello
 */
conversationRouter.get(
  '/test-stream',
  rateLimitConfigs.testChatbot,
  asyncHandler(conversationController.testChatbotStream),
)

/**
 * Lấy chi tiết conversation
 * GET /conversations/:id
 */
conversationRouter.get(
  '/:id',
  rateLimitConfigs.conversation,
  validate(conversationIdParamSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.getConversation),
)

/**
 * Gửi tin nhắn trong conversation
 * POST /conversations/:id/messages
 * Body: { message: string }
 */
conversationRouter.post(
  '/:id/messages',
  rateLimitConfigs.sendMessage,
  validate(conversationIdParamSchema),
  validate(sendMessageSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.sendMessage),
)

/**
 * Cập nhật conversation
 * PUT /conversations/:id
 * Body: { title?: string, status?: string }
 */
conversationRouter.put(
  '/:id',
  rateLimitConfigs.conversation,
  validate(conversationIdParamSchema),
  validate(updateConversationSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.updateConversation),
)

/**
 * Xóa conversation
 * DELETE /conversations/:id
 */
conversationRouter.delete(
  '/:id',
  rateLimitConfigs.conversation,
  validate(conversationIdParamSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(conversationController.deleteConversation),
)

export default conversationRouter
