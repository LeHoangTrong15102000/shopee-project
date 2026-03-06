import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Get questions schema
 * Validates query params for listing questions
 */
export const getQuestionsSchema = z.object({
  query: z.object({
    product_id: mongoIdSchema.refine((val) => val, {
      message: 'Product ID không hợp lệ',
    }),
    page: z.coerce
      .number()
      .int('Page phải là số nguyên dương')
      .min(1, 'Page phải là số nguyên dương')
      .optional(),
    limit: z.coerce
      .number()
      .int('Limit phải từ 1 đến 50')
      .min(1, 'Limit phải từ 1 đến 50')
      .max(50, 'Limit phải từ 1 đến 50')
      .optional(),
    sort: z
      .enum(['newest', 'oldest', 'most_liked'])
      .optional(),
  }).passthrough(),
})

/**
 * Ask question schema
 * Validates body for asking a question
 */
export const askQuestionSchema = z.object({
  body: z.object({
    product_id: mongoIdSchema.refine((val) => val, {
      message: 'Product ID không hợp lệ',
    }),
    question: z
      .string()
      .min(10, 'Câu hỏi phải từ 10 đến 2000 ký tự')
      .max(2000, 'Câu hỏi phải từ 10 đến 2000 ký tự'),
  }),
})

/**
 * Answer question schema
 * Validates params and body for answering a question
 */
export const answerQuestionSchema = z.object({
  params: z.object({
    questionId: mongoIdSchema.refine((val) => val, {
      message: 'Question ID không hợp lệ',
    }),
  }),
  body: z.object({
    answer: z
      .string()
      .min(1, 'Câu trả lời phải từ 1 đến 2000 ký tự')
      .max(2000, 'Câu trả lời phải từ 1 đến 2000 ký tự'),
    is_seller: z.boolean().optional(),
  }),
})

/**
 * Like question schema
 * Validates questionId param
 */
export const likeQuestionSchema = z.object({
  params: z.object({
    questionId: mongoIdSchema.refine((val) => val, {
      message: 'Question ID không hợp lệ',
    }),
  }),
})

/**
 * Like answer schema
 * Validates questionId and answerId params
 */
export const likeAnswerSchema = z.object({
  params: z.object({
    questionId: mongoIdSchema.refine((val) => val, {
      message: 'Question ID không hợp lệ',
    }),
    answerId: mongoIdSchema.refine((val) => val, {
      message: 'Answer ID không hợp lệ',
    }),
  }),
})

// Type exports
export type GetQuestionsQuery = z.infer<typeof getQuestionsSchema>['query']
export type AskQuestionInput = z.infer<typeof askQuestionSchema>['body']
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>['body']

