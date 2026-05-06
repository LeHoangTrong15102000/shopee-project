import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

export interface ShopConversation {
  _id: string
  shopId: string
  shopName: string
  shopAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
}

export interface ShopConversationsResponse {
  conversations: ShopConversation[]
}

const shopChatApi = {
  getConversations: () => {
    return http.get<SuccessResponseApi<ShopConversationsResponse>>('/shop-conversations')
  },

  createConversation: (shopId: string) => {
    return http.post<SuccessResponseApi<ShopConversation>>('/shop-conversations', { shopId })
  },
}

export default shopChatApi
