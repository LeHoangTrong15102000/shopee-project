/// <reference types="jest" />

const mockNotificationData = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  type: 'order',
  title: 'Order Shipped',
  message: 'Your order has been shipped',
  is_read: false,
  createdAt: new Date(),
  toObject: () => mockNotificationData,
}

jest.mock('@database/models/notification.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ toObject: () => mockNotificationData }),
  }))
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.findOneAndUpdate = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  return { NotificationModel: mockModel }
})

import { NotificationModel } from '@database/models/notification.model'
import { NotificationRepository } from '../../repositories/notification.repository'

describe('NotificationRepository', () => {
  let repository: NotificationRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new NotificationRepository()
  })

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockNotificationData)
      ;(NotificationModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(NotificationModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockNotificationData)
    })
  })

  describe('findOne', () => {
    it('should find one notification with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockNotificationData)
      ;(NotificationModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const filter = { user: '507f1f77bcf86cd799439012' }
      const result = await repository.findOne(filter)

      expect(NotificationModel.findOne).toHaveBeenCalledWith(filter)
      expect(result).toEqual(mockNotificationData)
    })
  })

  describe('find', () => {
    it('should find notifications with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockNotificationData])
      ;(NotificationModel.find as jest.Mock).mockReturnValue({ lean: mockLean })

      const filter = { user: '507f1f77bcf86cd799439012' }
      const result = await repository.find(filter)

      expect(NotificationModel.find).toHaveBeenCalledWith(filter, null, undefined)
      expect(result).toEqual([mockNotificationData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockNotificationData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(NotificationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockNotificationData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new notification', async () => {
      const result = await repository.create({
        user: '507f1f77bcf86cd799439012',
        type: 'order',
        title: 'Order Shipped',
        message: 'Your order has been shipped',
      } as any)
      expect(result).toEqual(mockNotificationData)
    })
  })

  describe('updateById', () => {
    it('should update notification by id', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockNotificationData, is_read: true })
      ;(NotificationModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { is_read: true })

      expect(NotificationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { is_read: true },
        { new: true },
      )
      expect(result?.is_read).toBe(true)
    })
  })

  describe('updateMany', () => {
    it('should update many notifications', async () => {
      ;(NotificationModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 })

      const result = await repository.updateMany(
        { user: '507f1f77bcf86cd799439012' },
        { $set: { is_read: true } },
      )

      expect(result).toBe(5)
    })
  })

  describe('deleteById', () => {
    it('should delete notification by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockNotificationData)
      ;(NotificationModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(NotificationModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockNotificationData)
    })
  })

  describe('deleteMany', () => {
    it('should delete many notifications', async () => {
      ;(NotificationModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 })

      const result = await repository.deleteMany({ user: '507f1f77bcf86cd799439012' })

      expect(result).toBe(3)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ user: '507f1f77bcf86cd799439012' })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(NotificationModel.exists as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
      })
      const result = await repository.exists({ user: '507f1f77bcf86cd799439012' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(NotificationModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ user: 'nonexistent' })
      expect(result).toBe(false)
    })
  })

  describe('findByUser', () => {
    it('should find notifications by user with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockNotificationData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(NotificationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByUser(
        '507f1f77bcf86cd799439012',
        {},
        { page: 1, limit: 10 },
      )

      expect(result.data).toEqual([mockNotificationData])
    })

    it('should filter by type when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockNotificationData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(NotificationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findByUser(
        '507f1f77bcf86cd799439012',
        { type: 'order' },
        { page: 1, limit: 10 },
      )

      expect(NotificationModel.find).toHaveBeenCalled()
    })

    it('should filter by is_read when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockNotificationData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(NotificationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findByUser(
        '507f1f77bcf86cd799439012',
        { is_read: false },
        { page: 1, limit: 10 },
      )

      expect(NotificationModel.find).toHaveBeenCalled()
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockNotificationData, is_read: true })
      ;(NotificationModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.markAsRead(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(NotificationModel.findOneAndUpdate).toHaveBeenCalled()
      expect(result?.is_read).toBe(true)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      ;(NotificationModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 10 })

      const result = await repository.markAllAsRead('507f1f77bcf86cd799439012')

      expect(NotificationModel.updateMany).toHaveBeenCalled()
      expect(result).toBe(10)
    })
  })

  describe('countUnread', () => {
    it('should count unread notifications for user', async () => {
      ;(NotificationModel.countDocuments as jest.Mock).mockResolvedValue(5)

      const result = await repository.countUnread('507f1f77bcf86cd799439012')

      expect(NotificationModel.countDocuments).toHaveBeenCalled()
      expect(result).toBe(5)
    })
  })

  describe('createNotification', () => {
    it('should create a notification using create method', async () => {
      const result = await repository.createNotification({
        user: '507f1f77bcf86cd799439012',
        type: 'order',
        title: 'Order Shipped',
        message: 'Your order has been shipped',
      } as any)

      expect(result).toEqual(mockNotificationData)
    })
  })
})
