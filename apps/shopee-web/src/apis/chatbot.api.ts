import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'
import {
  Conversation,
  ConversationListResponse,
  ChatCompletionResponse,
  TestChatbotResponse,
  CreateConversationBody,
  SendMessageBody,
  UpdateConversationBody,
  GetConversationsParams,
  TestChatbotBody,
} from 'src/types/chatbot.type'
import config from 'src/constant/config'
import { getAccessTokenFromLS } from 'src/utils/auth'

export interface ApiOptions {
  signal?: AbortSignal
}

const chatbotApi = {
  getConversations: (params?: GetConversationsParams, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<ConversationListResponse>>('/conversations', {
      params,
      signal: options?.signal,
    })
  },

  getConversation: (id: string, options?: ApiOptions) => {
    return http.get<SuccessResponseApi<Conversation>>(`/conversations/${id}`, {
      signal: options?.signal,
    })
  },

  createConversation: (body: CreateConversationBody, options?: ApiOptions) => {
    return http.post<SuccessResponseApi<ChatCompletionResponse>>('/conversations', body, {
      signal: options?.signal,
    })
  },

  sendMessage: (conversationId: string, body: SendMessageBody, options?: ApiOptions) => {
    return http.post<SuccessResponseApi<ChatCompletionResponse>>(
      `/conversations/${conversationId}/messages`,
      body,
      {
        signal: options?.signal,
      },
    )
  },

  updateConversation: (id: string, body: UpdateConversationBody, options?: ApiOptions) => {
    return http.put<SuccessResponseApi<Conversation>>(`/conversations/${id}`, body, {
      signal: options?.signal,
    })
  },

  deleteConversation: (id: string, options?: ApiOptions) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/conversations/${id}`, {
      signal: options?.signal,
    })
  },

  testChatbot: (body: TestChatbotBody, options?: ApiOptions) => {
    return http.post<SuccessResponseApi<TestChatbotResponse>>('/conversations/test', body, {
      signal: options?.signal,
    })
  },

  testChatbotStream: (body: TestChatbotBody) => {
    return fetch(
      `${config.baseUrl}conversations/test-stream?message=${encodeURIComponent(body.message)}`,
      {
        method: 'GET',
        headers: {
          authorization: getAccessTokenFromLS(),
        },
      },
    )
  },
}

export default chatbotApi
