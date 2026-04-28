export type MessageType = 'text' | 'image'
export type SenderType = 'user' | 'shop'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderType: SenderType
  content: string
  type: MessageType
  imageUrl?: string
  readAt?: string
  status?: MessageStatus
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  _id: string
  userId: string
  shopId: string
  shopName?: string
  shopAvatar?: string
  lastMessage?: {
    content: string
    senderId: string
    createdAt: string
  }
  unreadCount: number
  updatedAt: string
  createdAt: string
}

export interface MessagesResponse {
  data: Message[]
  nextCursor?: string
}

export interface ConversationsResponse {
  data: Conversation[]
}
