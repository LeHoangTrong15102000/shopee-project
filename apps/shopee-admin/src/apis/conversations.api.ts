import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface ConversationMessage {
  _id: string
  sender_type: 'user' | 'admin' | 'bot'
  content: string
  createdAt: string
}

export interface Conversation {
  _id: string
  user: string | { _id: string; name: string; email: string }
  title?: string
  messages: ConversationMessage[]
  message_count: number
  status: 'active' | 'archived' | 'open' | 'closed' | 'pending'
  createdAt: string
  updatedAt: string
  lastActivity?: string
}

export interface ConversationListResponse {
  conversations: Conversation[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ConversationListParams {
  page?: number
  limit?: number
  user_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

const conversationsApi = {
  getConversations: (params?: ConversationListParams) =>
    http.get<SuccessResponse<ConversationListResponse>>('admin/conversations', {
      params: { page: 1, limit: 10, ...params },
    }),

  getConversation: (id: string) =>
    http.get<SuccessResponse<Conversation>>(`admin/conversations/${id}`),

  deleteConversation: (id: string) =>
    http.delete<SuccessResponse<null>>(`admin/conversations/${id}`),
}

export default conversationsApi
