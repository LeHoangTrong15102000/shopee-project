/// <reference types="jest" />
import { Types } from 'mongoose'
import { FeedService } from '@services/feed.service'
import { ValidationError } from '@services/base.service'

const mockFind = jest.fn()
const mockUpdateOne = jest.fn()
const mockUpdateMany = jest.fn()
const mockCountDocuments = jest.fn()

jest.mock('@database/models/feed-item.model', () => ({
  FeedItemModel: {
    find: (...args: unknown[]) => mockFind(...args),
    updateOne: (...args: unknown[]) => mockUpdateOne(...args),
    updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
  },
}))

describe('FeedService', () => {
  let service: FeedService
  const userId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new FeedService()
  })

  describe('getFeed', () => {
    it('throws ValidationError for invalid userId', async () => {
      await expect(service.getFeed('bad-id')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for invalid cursor', async () => {
      await expect(service.getFeed(userId, 10, 'bad-cursor')).rejects.toThrow(ValidationError)
    })

    it('returns items with hasMore=false when fewer items than limit', async () => {
      const items = [
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), isRead: false },
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), isRead: false },
      ]
      mockFind.mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve(items),
          }),
        }),
      })

      const result = await service.getFeed(userId, 10)

      expect(result.items).toHaveLength(2)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('returns hasMore=true and nextCursor when more items exist', async () => {
      // Return limit+1 items to signal there are more
      const limit = 2
      const items = Array.from({ length: limit + 1 }, () => ({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        isRead: false,
      }))
      mockFind.mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve(items),
          }),
        }),
      })

      const result = await service.getFeed(userId, limit)

      expect(result.items).toHaveLength(limit)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe(items[limit - 1]._id.toString())
    })

    it('returns empty result when no feed items exist', async () => {
      mockFind.mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      })

      const result = await service.getFeed(userId, 10)

      expect(result.items).toHaveLength(0)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('applies cursor filter when cursor is provided', async () => {
      const cursor = new Types.ObjectId().toString()
      mockFind.mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      })

      await service.getFeed(userId, 10, cursor)

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.objectContaining({ $lt: expect.any(Types.ObjectId) }),
        }),
      )
    })
  })

  describe('markAsRead', () => {
    it('throws ValidationError for invalid userId', async () => {
      await expect(service.markAsRead('bad-id', new Types.ObjectId().toString())).rejects.toThrow(
        ValidationError,
      )
    })

    it('throws ValidationError for invalid feedItemId', async () => {
      await expect(service.markAsRead(userId, 'bad-id')).rejects.toThrow(ValidationError)
    })

    it('returns true when item was updated', async () => {
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })
      const result = await service.markAsRead(userId, new Types.ObjectId().toString())
      expect(result).toBe(true)
    })

    it('returns false when item was not found', async () => {
      mockUpdateOne.mockResolvedValue({ modifiedCount: 0 })
      const result = await service.markAsRead(userId, new Types.ObjectId().toString())
      expect(result).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('throws ValidationError for invalid userId', async () => {
      await expect(service.markAllAsRead('bad-id')).rejects.toThrow(ValidationError)
    })

    it('returns count of updated items', async () => {
      mockUpdateMany.mockResolvedValue({ modifiedCount: 5 })
      const result = await service.markAllAsRead(userId)
      expect(result).toBe(5)
    })
  })

  describe('getUnreadCount', () => {
    it('throws ValidationError for invalid userId', async () => {
      await expect(service.getUnreadCount('bad-id')).rejects.toThrow(ValidationError)
    })

    it('returns unread count', async () => {
      mockCountDocuments.mockResolvedValue(7)
      const result = await service.getUnreadCount(userId)
      expect(result).toBe(7)
    })
  })
})
