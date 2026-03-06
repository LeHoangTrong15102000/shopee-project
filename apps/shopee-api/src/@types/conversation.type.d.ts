import {
  MessageRole,
  ConversationStatus,
} from '../database/models/conversation.model'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

export interface ConversationRequest {
  message: string
  conversationId?: string // Optional cho conversation mới
}

export interface ConversationResponse {
  _id: string
  user: string
  title: string
  messages: ChatMessage[]
  status: ConversationStatus
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChatCompletionRequest {
  conversationId?: string
  message: string
}

export interface ChatCompletionResponse {
  conversationId: string
  message: ChatMessage
  totalMessages: number
}

export interface GetConversationsRequest {
  page?: number
  limit?: number
  status?: ConversationStatus
}

export interface GetConversationsResponse {
  conversations: ConversationResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Request body validation interfaces
export interface CreateConversationBody {
  message: string
  title?: string
}

export interface SendMessageBody {
  message: string
}

export interface UpdateConversationBody {
  title?: string
  status?: ConversationStatus
}
