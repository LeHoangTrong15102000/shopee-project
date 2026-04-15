import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { POINTS_TRANSACTION_TYPE, REWARD_TYPE } from '@database/models/loyalty.model'

/**
 * Transaction type enum
 */
const transactionTypeValues = Object.values(POINTS_TRANSACTION_TYPE) as [string, ...string[]]
const transactionTypeEnum = z.enum(transactionTypeValues).catch('earn')

/**
 * Reward type enum
 */
const rewardTypeValues = Object.values(REWARD_TYPE) as [string, ...string[]]
const rewardTypeEnum = z.enum(rewardTypeValues).catch('voucher')

/**
 * Get points schema (empty - no validation needed)
 */
export const getPointsSchema = z.object({})

/**
 * Get transactions schema
 * Validates query params for listing point transactions
 */
export const getTransactionsSchema = z.object({
  query: z
    .object({
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
      type: transactionTypeEnum.optional(),
    })
    .passthrough(),
})

/**
 * Get rewards schema
 * Validates query params for listing available rewards
 */
export const getRewardsSchema = z.object({
  query: z
    .object({
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
      reward_type: rewardTypeEnum.optional(),
    })
    .passthrough(),
})

/**
 * Redeem points schema
 * Validates reward ID param
 */
export const redeemPointsSchema = z.object({
  params: z.object({
    rewardId: mongoIdSchema.refine((val) => val, {
      message: 'Reward ID không hợp lệ',
    }),
  }),
})

// Type exports
export type GetTransactionsQuery = z.infer<typeof getTransactionsSchema>['query']
export type GetRewardsQuery = z.infer<typeof getRewardsSchema>['query']
