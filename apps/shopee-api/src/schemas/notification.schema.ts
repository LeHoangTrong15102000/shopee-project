import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { NOTIFICATION_TYPE } from '@database/models/notification.model'

/**
 * Notification type enum
 */
const notificationTypeValues = Object.values(NOTIFICATION_TYPE) as [string, ...string[]]
const notificationTypeEnum = z.enum(notificationTypeValues).catch('other')

/**
 * Get notifications schema
 * Validates query params for listing notifications
 */
export const getNotificationsSchema = z.object({
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
      type: notificationTypeEnum.optional(),
      is_read: z.enum(['true', 'false']).optional(),
    })
    .passthrough(),
})

/**
 * Mark as read schema
 * Validates notification ID param
 */
export const markAsReadSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'Notification ID không hợp lệ',
    }),
  }),
})

/**
 * Delete notification schema
 * Validates notification ID param
 */
export const deleteNotificationSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'Notification ID không hợp lệ',
    }),
  }),
})

// Type exports
export type GetNotificationsQuery = z.infer<typeof getNotificationsSchema>['query']
