import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Conversation status enum
 */
const conversationStatusEnum = z.enum(['active', 'archived']).catch('active')

/**
 * Create conversation schema
 * Validates message and optional title
 */
export const createConversationSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, 'Tin nhắn không được để trống')
      .max(10000, 'Tin nhắn phải từ 1 đến 10000 ký tự'),
    title: z.string().max(200, 'Tiêu đề không được quá 200 ký tự').optional(),
  }),
})

/**
 * Send message schema
 * Validates message content
 */
export const sendMessageSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, 'Tin nhắn không được để trống')
      .max(10000, 'Tin nhắn phải từ 1 đến 10000 ký tự'),
  }),
})

/**
 * Update conversation schema
 * Validates title and status
 */
export const updateConversationSchema = z.object({
  body: z.object({
    title: z.string().max(200, 'Tiêu đề không được quá 200 ký tự').optional(),
    status: conversationStatusEnum.optional(),
  }),
})

/**
 * Get conversations schema
 * Validates query params for listing conversations
 */
export const getConversationsSchema = z.object({
  query: z
    .object({
      page: z.coerce
        .number()
        .int('Trang phải là số nguyên dương')
        .min(1, 'Trang phải là số nguyên dương')
        .optional(),
      limit: z.coerce
        .number()
        .int('Limit phải từ 1 đến 100')
        .min(1, 'Limit phải từ 1 đến 100')
        .max(100, 'Limit phải từ 1 đến 100')
        .optional(),
      status: conversationStatusEnum.optional(),
    })
    .passthrough(),
})

/**
 * Test chatbot schema
 * Validates test message
 */
export const testChatbotSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, 'Tin nhắn test không được để trống')
      .max(1000, 'Tin nhắn test phải từ 1 đến 1000 ký tự'),
  }),
})

/**
 * Conversation ID param schema
 * Validates conversation ID in route params
 */
export const conversationIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'ID cuộc trò chuyện không hợp lệ',
    }),
  }),
})

// Type exports
export type CreateConversationInput = z.infer<typeof createConversationSchema>['body']
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body']
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>['body']
export type GetConversationsQuery = z.infer<typeof getConversationsSchema>['query']
export type TestChatbotInput = z.infer<typeof testChatbotSchema>['body']
