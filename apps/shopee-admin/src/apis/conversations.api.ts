import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface ConversationMessage {
  _id: string
  sender: string
  sender_type: 'user' | 'admin' | 'bot'
  content: string
  createdAt: string
}

export interface Conversation {
  _id: string
  user: string | { _id: string; name: string; email: string }
  messages: ConversationMessage[]
  message_count: number
  status: 'open' | 'closed' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface ConversationListResponse {
  conversations: Conversation[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const conversationsApi = {
  getConversations: (page = 1) =>
    http.get<SuccessResponse<ConversationListResponse>>('conversations', {
      params: { page, limit: 10 },
    }),

  getConversation: (id: string) =>
    http.get<SuccessResponse<Conversation>>(`conversations/${id}`),
}

export default conversationsApi
