import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  _id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Conversation {
  _id: string
  title: string
  lastMessage?: string
  createdAt: string
  updatedAt: string
}

export interface ConversationDetail {
  _id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const res = await http.get<ApiResponse<Conversation[]>>('conversations')
  return res.data.data
}

export async function createConversation(message: string, title?: string): Promise<ConversationDetail> {
  const res = await http.post<ApiResponse<ConversationDetail>>('conversations', { message, title })
  return res.data.data
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await http.get<ApiResponse<ConversationDetail>>(`conversations/${id}`)
  return res.data.data
}

export async function sendMessage(id: string, message: string): Promise<Message> {
  const res = await http.post<ApiResponse<Message>>(`conversations/${id}/messages`, { message })
  return res.data.data
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const res = await http.put<ApiResponse<Conversation>>(`conversations/${id}`, { title })
  return res.data.data
}

export async function deleteConversation(id: string): Promise<void> {
  await http.delete<ApiResponse<void>>(`conversations/${id}`)
}
