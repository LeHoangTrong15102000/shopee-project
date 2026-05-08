import http from 'src/utils/http'
import type {
  ShopConversationListParams,
  ShopConversationListResponse,
  ShopMessagesResponse,
  ShopConversation,
  ConversationFlag,
} from 'src/types/shop-chat.types'

interface SuccessResponse<T> {
  message: string
  data: T
}

const shopChatApi = {
  getAdminShopConversations: (params?: ShopConversationListParams) =>
    http.get<SuccessResponse<ShopConversationListResponse>>('admin/shop-conversations', { params }),

  getConversationById: (id: string) =>
    http.get<SuccessResponse<ShopConversation>>(`admin/shop-conversations/${id}`),

  getConversationMessages: (id: string, cursor?: string, limit = 30) =>
    http.get<SuccessResponse<ShopMessagesResponse>>(`admin/shop-conversations/${id}/messages`, {
      params: { ...(cursor ? { cursor } : {}), limit },
    }),

  flagConversation: (id: string, data: ConversationFlag) =>
    http.patch<SuccessResponse<ShopConversation>>(`admin/shop-conversations/${id}/flag`, data),
}

export default shopChatApi
