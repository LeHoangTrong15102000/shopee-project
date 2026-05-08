import mongoose, { Schema } from 'mongoose'

interface IWishlist {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  addedAt: Date
}

const WishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'products',
      required: true,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
)

// Compound unique index: mỗi user chỉ có thể thêm 1 product 1 lần
WishlistSchema.index({ user: 1, product: 1 }, { unique: true })

// Analytics indexes: support aggregation queries on product and addedAt
WishlistSchema.index({ product: 1, addedAt: -1 })
WishlistSchema.index({ addedAt: 1 })

export const WishlistModel = mongoose.model<IWishlist>('wishlists', WishlistSchema)

export { IWishlist }
