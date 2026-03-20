/// <reference types="jest" />

jest.mock('@database/models/notification.model', () => ({
  NOTIFICATION_TYPE: {
    ORDER: 'order',
    PROMOTION: 'promotion',
    SYSTEM: 'system',
  },
}))

import {
  adminCreateNotificationSchema, adminBroadcastNotificationSchema,
  adminGetNotificationsSchema, adminDeleteNotificationSchema,
} from '@schemas/admin-notification.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Notification Schemas', () => {
  describe('adminCreateNotificationSchema', () => {
    it('should accept valid input', () => {
      expect(adminCreateNotificationSchema.safeParse({
        body: { user_id: VALID_ID, title: 'Test', content: 'Content', type: 'order' }
      }).success).toBe(true)
    })
    it('should reject empty title', () => {
      expect(adminCreateNotificationSchema.safeParse({
        body: { user_id: VALID_ID, title: '', content: 'Content', type: 'order' }
      }).success).toBe(false)
    })
    it('should reject invalid type', () => {
      expect(adminCreateNotificationSchema.safeParse({
        body: { user_id: VALID_ID, title: 'Test', content: 'Content', type: 'invalid' }
      }).success).toBe(false)
    })
  })

  describe('adminBroadcastNotificationSchema', () => {
    it('should accept valid input', () => {
      expect(adminBroadcastNotificationSchema.safeParse({
        body: { title: 'Broadcast', content: 'Hello all', type: 'promotion' }
      }).success).toBe(true)
    })
    it('should reject missing content', () => {
      expect(adminBroadcastNotificationSchema.safeParse({
        body: { title: 'Broadcast', type: 'promotion' }
      }).success).toBe(false)
    })
  })

  describe('adminGetNotificationsSchema', () => {
    it('should accept valid query', () => {
      expect(adminGetNotificationsSchema.safeParse({ query: { page: 1, limit: 10 } }).success).toBe(true)
    })
    it('should accept type filter', () => {
      expect(adminGetNotificationsSchema.safeParse({ query: { type: 'order' } }).success).toBe(true)
    })
  })

  describe('adminDeleteNotificationSchema', () => {
    it('should accept valid id', () => {
      expect(adminDeleteNotificationSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid id', () => {
      expect(adminDeleteNotificationSchema.safeParse({ params: { id: 'bad' } }).success).toBe(false)
    })
  })
})
