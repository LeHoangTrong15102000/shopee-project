import mongoose, { Schema } from 'mongoose'

// Interface cho Review
interface IReview {
  user: mongoose.Types.ObjectId
  product: mongoose.Types.ObjectId
  purchase: mongoose.Types.ObjectId
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  moderation_status: 'pending' | 'approved' | 'flagged'
  createdAt: Date
  updatedAt: Date
}

// Schema cho Review
const ReviewSchema = new Schema<IReview>(
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
    purchase: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'purchases',
      required: true,
      unique: true, // Một purchase chỉ có thể có một review
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    images: [
      {
        type: String,
        maxlength: 1000,
      },
    ],
    helpful_count: {
      type: Number,
      default: 0,
    },
    moderation_status: {
      type: String,
      enum: ['pending', 'approved', 'flagged'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Tạo compound indexes
ReviewSchema.index({ product: 1, createdAt: -1 }) // Lấy reviews theo sản phẩm
ReviewSchema.index({ user: 1, createdAt: -1 }) // Lấy reviews của user
ReviewSchema.index({ rating: 1 }) // Filter theo rating

// Export model
export const ReviewModel = mongoose.model<IReview>('reviews', ReviewSchema)

// Export interface
export { IReview }
