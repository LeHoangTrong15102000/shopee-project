// Enum types matching backend
export type MessageRole = 'user' | 'assistant'
export type ConversationStatus = 'active' | 'archived'

// Message type
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

// Conversation type
export interface Conversation {
  _id: string
  user: string
  title: string
  messages: ChatMessage[]
  status: ConversationStatus
  lastActivity: string
  createdAt: string
  updatedAt: string
}

// Conversation without messages (for list view)
export interface ConversationSummary {
  _id: string
  user: string
  title: string
  status: ConversationStatus
  lastActivity: string
  createdAt: string
  updatedAt: string
}

// Pagination type
export interface ConversationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Response types
export interface ConversationListResponse {
  conversations: ConversationSummary[]
  pagination: ConversationPagination
}

export interface ChatCompletionResponse {
  conversationId: string
  message: ChatMessage
  totalMessages: number
}

export interface TestChatbotResponse {
  userMessage: string
  botResponse: string
  timestamp: string
}

// Request types
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

export interface GetConversationsParams {
  page?: number
  limit?: number
  status?: ConversationStatus
}

export interface TestChatbotBody {
  message: string
}

// Streaming event types
export interface StreamStartEvent {
  type: 'start'
  message: string
  userMessage: string
}

export interface StreamChunkEvent {
  type: 'chunk'
  content: string
  fullContent: string
}

export interface StreamCompleteEvent {
  type: 'complete'
  message: string
  fullResponse: string
  timestamp: string
}

export interface StreamErrorEvent {
  type: 'error'
  message: string
  fallback: string
}

export type StreamEvent = StreamStartEvent | StreamChunkEvent | StreamCompleteEvent | StreamErrorEvent
