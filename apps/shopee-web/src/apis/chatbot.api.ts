import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'
import {
  Conversation,
  ConversationListResponse,
  ChatCompletionResponse,
  TestChatbotResponse,
  CreateConversationBody,
  SendMessageBody,
  UpdateConversationBody,
  GetConversationsParams,
  TestChatbotBody,
  ConversationSummary,
  ChatMessage,
  ConversationStatus,
  MessageRole
} from 'src/types/chatbot.type'
import config from 'src/constant/config'
import { getAccessTokenFromLS } from 'src/utils/auth'

export interface ApiOptions {
  signal?: AbortSignal
}

// Mock data for fallback when API is not available
const mockConversations: ConversationSummary[] = [
  {
    _id: 'mock-conv-1',
    user: 'mock-user-id',
    title: 'Hỏi về chính sách đổi trả',
    status: 'active' as ConversationStatus,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-conv-2',
    user: 'mock-user-id',
    title: 'Tư vấn chọn size áo',
    status: 'active' as ConversationStatus,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-conv-3',
    user: 'mock-user-id',
    title: 'Hỏi về thời gian giao hàng',
    status: 'archived' as ConversationStatus,
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockMessages: ChatMessage[] = [
  {
    id: 'mock-msg-1',
    role: 'user' as MessageRole,
    content: 'Tôi muốn hỏi về chính sách đổi trả hàng?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-msg-2',
    role: 'assistant' as MessageRole,
    content:
      'Chào bạn! Shopee có chính sách đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Bạn cần đảm bảo sản phẩm còn nguyên tem, nhãn và chưa qua sử dụng. Bạn muốn biết thêm chi tiết về trường hợp nào?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString()
  },
  {
    id: 'mock-msg-3',
    role: 'user' as MessageRole,
    content: 'Nếu sản phẩm bị lỗi thì sao?',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-msg-4',
    role: 'assistant' as MessageRole,
    content:
      'Nếu sản phẩm bị lỗi do nhà sản xuất, bạn có thể yêu cầu đổi trả miễn phí trong vòng 30 ngày. Vui lòng chụp ảnh sản phẩm lỗi và liên hệ với người bán qua Shopee Chat để được hỗ trợ nhanh nhất.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000 + 5000).toISOString()
  }
]

const mockConversation: Conversation = {
  _id: 'mock-conv-1',
  user: 'mock-user-id',
  title: 'Hỏi về chính sách đổi trả',
  messages: mockMessages,
  status: 'active' as ConversationStatus,
  lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
}

const chatbotApi = {
  getConversations: async (params?: GetConversationsParams, options?: ApiOptions) => {
    try {
      const response = await http.get<SuccessResponseApi<ConversationListResponse>>('/conversations', {
        params,
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [getConversations] API not available, using mock data')
      const page = params?.page || 1
      const limit = params?.limit || 10
      const filteredConversations = params?.status
        ? mockConversations.filter((c) => c.status === params.status)
        : mockConversations
      return {
        data: {
          message: 'Lấy danh sách hội thoại thành công',
          data: {
            conversations: filteredConversations.slice((page - 1) * limit, page * limit),
            pagination: {
              page,
              limit,
              total: filteredConversations.length,
              totalPages: Math.ceil(filteredConversations.length / limit)
            }
          } as ConversationListResponse
        }
      }
    }
  },

  getConversation: async (id: string, options?: ApiOptions) => {
    try {
      const response = await http.get<SuccessResponseApi<Conversation>>(`/conversations/${id}`, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [getConversation] API not available, using mock data')
      return {
        data: {
          message: 'Lấy chi tiết hội thoại thành công',
          data: { ...mockConversation, _id: id } as Conversation
        }
      }
    }
  },

  createConversation: async (body: CreateConversationBody, options?: ApiOptions) => {
    try {
      const response = await http.post<SuccessResponseApi<ChatCompletionResponse>>('/conversations', body, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [createConversation] API not available, using mock data')
      const newConversationId = `mock-conv-${Date.now()}`
      const mockResponse: ChatCompletionResponse = {
        conversationId: newConversationId,
        message: {
          id: `mock-msg-${Date.now()}`,
          role: 'assistant' as MessageRole,
          content: 'Chào bạn! Tôi là trợ lý ảo của Shopee. Tôi có thể giúp gì cho bạn hôm nay?',
          timestamp: new Date().toISOString()
        },
        totalMessages: 2
      }
      return {
        data: {
          message: 'Tạo hội thoại thành công',
          data: mockResponse
        }
      }
    }
  },

  sendMessage: async (conversationId: string, body: SendMessageBody, options?: ApiOptions) => {
    try {
      const response = await http.post<SuccessResponseApi<ChatCompletionResponse>>(
        `/conversations/${conversationId}/messages`,
        body,
        {
          signal: options?.signal
        }
      )
      return response
    } catch (error) {
      console.warn('⚠️ [sendMessage] API not available, using mock data')
      const mockResponse: ChatCompletionResponse = {
        conversationId,
        message: {
          id: `mock-msg-${Date.now()}`,
          role: 'assistant' as MessageRole,
          content:
            'Cảm ơn bạn đã liên hệ! Hiện tại hệ thống đang bảo trì, vui lòng thử lại sau hoặc liên hệ hotline 1900-1234 để được hỗ trợ.',
          timestamp: new Date().toISOString()
        },
        totalMessages: mockMessages.length + 2
      }
      return {
        data: {
          message: 'Gửi tin nhắn thành công',
          data: mockResponse
        }
      }
    }
  },

  updateConversation: async (id: string, body: UpdateConversationBody, options?: ApiOptions) => {
    try {
      return await http.put<SuccessResponseApi<Conversation>>(`/conversations/${id}`, body, {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [updateConversation] API not available, using mock data')
      const updatedConversation: Conversation = {
        ...mockConversation,
        _id: id,
        title: body.title || mockConversation.title,
        status: body.status || mockConversation.status,
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Cập nhật hội thoại thành công (mock)',
          data: updatedConversation
        }
      }
    }
  },

  deleteConversation: async (id: string, options?: ApiOptions) => {
    try {
      return await http.delete<SuccessResponseApi<{ message: string }>>(`/conversations/${id}`, {
        signal: options?.signal
      })
    } catch (error) {
      console.warn('⚠️ [deleteConversation] API not available, using mock data')
      return {
        data: {
          message: 'Xóa hội thoại thành công (mock)',
          data: { message: 'Xóa hội thoại thành công' }
        }
      }
    }
  },

  testChatbot: async (body: TestChatbotBody, options?: ApiOptions) => {
    try {
      const response = await http.post<SuccessResponseApi<TestChatbotResponse>>('/conversations/test', body, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [testChatbot] API not available, using mock data')
      const mockResponse: TestChatbotResponse = {
        userMessage: body.message,
        botResponse: 'Chào bạn! Tôi là trợ lý ảo của Shopee. Hiện tại hệ thống đang bảo trì, vui lòng thử lại sau nhé!',
        timestamp: new Date().toISOString()
      }
      return {
        data: {
          message: 'Test chatbot thành công',
          data: mockResponse
        }
      }
    }
  },

  testChatbotStream: async (body: TestChatbotBody) => {
    try {
      const response = await fetch(
        `${config.baseUrl}conversations/test-stream?message=${encodeURIComponent(body.message)}`,
        {
          method: 'GET',
          headers: {
            authorization: getAccessTokenFromLS()
          }
        }
      )
      return response
    } catch (error) {
      console.warn('⚠️ [testChatbotStream] API not available, using mock stream response')
      // Create a mock ReadableStream response
      const mockStreamContent =
        'Chào bạn! Tôi là trợ lý ảo của Shopee. Hiện tại hệ thống đang bảo trì, vui lòng thử lại sau nhé!'
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(mockStreamContent))
          controller.close()
        }
      })
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    }
  }
}

export default chatbotApi
