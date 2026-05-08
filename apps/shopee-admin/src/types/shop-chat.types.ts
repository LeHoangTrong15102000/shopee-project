export interface ShopConversationUser {
  _id: string
  name?: string
  email: string
}

export interface ShopConversationShop {
  _id: string
  name: string
  avatar?: string
}

export interface ShopConversationLastMessage {
  content: string
  senderId: string
  createdAt: string
}

export interface ShopConversation {
  _id: string
  userId: ShopConversationUser | string
  shopId: ShopConversationShop | string
  lastMessage?: ShopConversationLastMessage
  unreadCount: number
  flagged: boolean
  flag_reason?: string
  message_count: number
  updatedAt: string
  createdAt: string
}

export interface ShopMessage {
  _id: string
  conversationId: string
  senderId: string
  senderType: 'user' | 'shop'
  content: string
  createdAt: string
}

export interface ConversationFlag {
  flagged: boolean
  reason?: string
}

export interface ShopConversationListParams {
  shop_id?: string
  user_id?: string
  date_from?: string
  date_to?: string
  flagged?: boolean
  page?: number
  limit?: number
}

export interface ShopConversationListResponse {
  conversations: ShopConversation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ShopMessagesResponse {
  messages: ShopMessage[]
  nextCursor: string | null
}
