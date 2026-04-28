import http from '@/utils/http'
import { Conversation, Message, MessagesResponse } from '@/types/chat.type'

interface ApiResponse<T> {
  message: string
  data: T
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await http.get<ApiResponse<Conversation[]>>('shop-conversations')
  return res.data.data
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 30,
): Promise<MessagesResponse> {
  const res = await http.get<ApiResponse<MessagesResponse>>(
    `shop-conversations/${conversationId}/messages`,
    { params: { cursor, limit } },
  )
  return res.data.data
}

export async function sendMessage(
  conversationId: string,
  body: { content: string; type: 'text' | 'image'; imageUrl?: string },
): Promise<Message> {
  const res = await http.post<ApiResponse<Message>>(
    `shop-conversations/${conversationId}/messages`,
    body,
  )
  return res.data.data
}

export async function createOrGetConversation(shopId: string): Promise<Conversation> {
  const res = await http.post<ApiResponse<Conversation>>('shop-conversations', { shopId })
  return res.data.data
}
