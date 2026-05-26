/**
 * FeedService — provides feed retrieval with cursor-based pagination and mark-as-read.
 */
import mongoose from 'mongoose'
import { FeedItemModel, IFeedItem } from '@database/models/feed-item.model'
import { BaseService, ValidationError } from './base.service'
import { Logger } from '@utils/logger'

export interface FeedCursorResult {
  items: IFeedItem[]
  nextCursor: string | null
  hasMore: boolean
}

export class FeedService extends BaseService {
  /**
   * Get paginated feed for a user using cursor-based pagination.
   * Cursor is the _id of the last item seen (oldest in the current page).
   */
  async getFeed(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<FeedCursorResult> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const safeLimit = Math.min(100, Math.max(1, limit))

    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    }

    if (cursor) {
      if (!this.isValidObjectId(cursor)) {
        throw new ValidationError('Invalid cursor format')
      }
      query['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) }
    }

    const items = await FeedItemModel.find(query)
      .sort({ _id: -1 })
      .limit(safeLimit + 1)
      .lean()

    const hasMore = items.length > safeLimit
    const pageItems = hasMore ? items.slice(0, safeLimit) : items
    const nextCursor =
      hasMore && pageItems.length > 0
        ? pageItems[pageItems.length - 1]._id!.toString()
        : null

    return {
      items: pageItems as IFeedItem[],
      nextCursor,
      hasMore,
    }
  }

  /**
   * Mark a specific feed item as read for a user.
   */
  async markAsRead(userId: string, feedItemId: string): Promise<boolean> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(feedItemId)) {
      throw new ValidationError('Invalid feed item ID format')
    }

    const result = await FeedItemModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(feedItemId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { isRead: true } },
    )

    return result.modifiedCount > 0
  }

  /**
   * Mark all feed items as read for a user.
   */
  async markAllAsRead(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const result = await FeedItemModel.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      { $set: { isRead: true } },
    )

    Logger.apiInfo('[FeedService] markAllAsRead', {
      userId,
      modifiedCount: result.modifiedCount,
    })

    return result.modifiedCount
  }

  /**
   * Get unread feed count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return FeedItemModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    })
  }
}
