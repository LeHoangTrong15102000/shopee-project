import mongoose, { Schema } from 'mongoose'

export type FeedActionType =
  | 'product.liked'
  | 'product.shared'
  | 'product.reviewed'
  | 'order.created'
export type FeedTargetType = 'product' | 'order'

export interface IFeedItem {
  _id?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  actorId: mongoose.Types.ObjectId
  actorName: string
  actorAvatar?: string
  actionType: FeedActionType
  targetType: FeedTargetType
  targetId: mongoose.Types.ObjectId
  /** Snapshot of target data at time of event (name, image, price, etc.) */
  targetSnapshot: Record<string, unknown>
  isRead: boolean
  createdAt: Date
}

const FeedItemSchema = new Schema<IFeedItem>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
    },
    actorName: { type: String, required: true, maxlength: 200 },
    actorAvatar: { type: String, maxlength: 1000 },
    actionType: {
      type: String,
      required: true,
      enum: ['product.liked', 'product.shared', 'product.reviewed', 'order.created'],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['product', 'order'],
    },
    targetId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    targetSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// TTL index: auto-delete feed items after 30 days
FeedItemSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

// Compound index for fetching a user's feed ordered by newest first
FeedItemSchema.index({ userId: 1, createdAt: -1 })

// Compound index for cursor-based pagination
FeedItemSchema.index({ userId: 1, _id: -1 })

export const FeedItemModel = mongoose.model<IFeedItem>('feed_items', FeedItemSchema)
