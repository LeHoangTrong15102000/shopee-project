import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { NOTIFICATION_TYPE } from '@database/models/notification.model'

const notificationTypeValues = Object.values(NOTIFICATION_TYPE) as [string, ...string[]]
const notificationTypeEnum = z.enum(notificationTypeValues)

/**
 * Admin create targeted notification schema
 */
export const adminCreateNotificationSchema = z.object({
  body: z.object({
    user_id: mongoIdSchema.describe('User ID không hợp lệ'),
    title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự'),
    content: z
      .string()
      .min(1, 'Nội dung không được để trống')
      .max(2000, 'Nội dung tối đa 2000 ký tự'),
    type: notificationTypeEnum,
  }),
})

/**
 * Admin broadcast notification schema
 */
export const adminBroadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự'),
    content: z
      .string()
      .min(1, 'Nội dung không được để trống')
      .max(2000, 'Nội dung tối đa 2000 ký tự'),
    type: notificationTypeEnum,
  }),
})

/**
 * Admin get notifications schema
 */
export const adminGetNotificationsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(50).optional(),
      type: notificationTypeEnum.optional(),
    })
    .passthrough(),
})

/**
 * Admin delete notification schema
 */
export const adminDeleteNotificationSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'Notification ID không hợp lệ',
    }),
  }),
})

// Type exports
export type AdminCreateNotificationInput = z.infer<typeof adminCreateNotificationSchema>['body']
export type AdminBroadcastNotificationInput = z.infer<
  typeof adminBroadcastNotificationSchema
>['body']
