import { Request, Response } from 'express'
import { CONVERSATION_STATUS } from '@database/models/conversation.model'
import { chatBotService } from '@utils/chatbot.service'
import { container } from '../container'
import {
  CreateConversationBody,
  SendMessageBody,
  UpdateConversationBody,
  GetConversationsRequest,
} from '../@types/conversation.type'

const conversationService = container.services.conversation

/**
 * Lấy danh sách conversations của user
 * GET /conversations
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const {
    page = 1,
    limit = 10,
    status = CONVERSATION_STATUS.ACTIVE,
  } = req.query as unknown as GetConversationsRequest

  const result = await conversationService.getConversations(
    userId,
    { status },
    { page: Number(page), limit: Number(limit) }
  )

  res.status(200).json({
    message: 'Lấy danh sách cuộc trò chuyện thành công',
    data: {
      conversations: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.page_size,
      },
    },
  })
}

/**
 * Lấy chi tiết một conversation
 * GET /conversations/:id
 */
export const getConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const conversationId = req.params.id

  const conversation = await conversationService.getConversation(userId, conversationId)

  res.status(200).json({
    message: 'Lấy cuộc trò chuyện thành công',
    data: conversation,
  })
}

/**
 * Tạo conversation mới và gửi tin nhắn đầu tiên
 * POST /conversations
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const { message, title }: CreateConversationBody = req.body

  const { conversation, aiMessage } = await conversationService.createConversation(userId, message, title)

  res.status(201).json({
    message: 'Tạo cuộc trò chuyện thành công',
    data: {
      conversationId: conversation._id,
      message: aiMessage,
      totalMessages: conversation.messages.length,
    },
  })
}

/**
 * Gửi tin nhắn trong conversation hiện tại
 * POST /conversations/:id/messages
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const conversationId = req.params.id
  const { message }: SendMessageBody = req.body

  const { conversation, aiMessage } = await conversationService.sendMessage(userId, conversationId, message)

  res.status(200).json({
    message: 'Gửi tin nhắn thành công',
    data: {
      conversationId: conversation._id,
      message: aiMessage,
      totalMessages: conversation.messages.length,
    },
  })
}

/**
 * Cập nhật conversation (title, status)
 * PUT /conversations/:id
 */
export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const conversationId = req.params.id
  const { title, status }: UpdateConversationBody = req.body

  const conversation = await conversationService.updateConversation(userId, conversationId, { title, status })

  res.status(200).json({
    message: 'Cập nhật cuộc trò chuyện thành công',
    data: conversation,
  })
}

/**
 * Xóa conversation
 * DELETE /conversations/:id
 */
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded.id
  const conversationId = req.params.id

  await conversationService.deleteConversation(userId, conversationId)

  res.status(200).json({
    message: 'Xóa cuộc trò chuyện thành công',
  })
}

/**
 * API để test chatbot
 * POST /conversations/test
 */
export const testChatbot = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body

  const response = await conversationService.testChatbot(message)

  res.status(200).json({
    message: 'Test chatbot thành công',
    data: {
      userMessage: message,
      botResponse: response,
      timestamp: new Date(),
    },
  })
}

/**
 * API để test chatbot với streaming
 * GET /conversations/test-stream?message=xxx
 */
export const testChatbotStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.query

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        message: 'Tham số message không được để trống',
      })
      return
    }

    // Setup Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    // Send initial event
    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        message: 'Bắt đầu streaming...',
        userMessage: message,
      })}\n\n`
    )

    let fullResponse = ''

    // Handle streaming chunks
    const onChunk = (chunk: string) => {
      fullResponse += chunk
      res.write(
        `data: ${JSON.stringify({
          type: 'chunk',
          content: chunk,
          fullContent: fullResponse,
        })}\n\n`
      )
    }

    // Handle completion
    const onComplete = () => {
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: 'Streaming hoàn tất',
          fullResponse,
          timestamp: new Date().toISOString(),
        })}\n\n`
      )
      res.end()
    }

    // Handle errors
    const onError = (error: string) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: error,
          fallback: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        })}\n\n`
      )
      res.end()
    }

    // Start streaming
    await chatBotService.generateStreamingResponse(
      [],
      message,
      onChunk,
      onComplete,
      onError
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in streaming test:', error)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Lỗi server khi test streaming',
        error: errorMessage,
      })
    }
  }
}

// Export compatibility object for existing route files
export const conversationController = {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  updateConversation,
  deleteConversation,
  testChatbot,
  testChatbotStream, // Thêm streaming test
}
