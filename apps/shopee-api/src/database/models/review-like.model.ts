import mongoose, { Schema } from 'mongoose'

// Interface cho ReviewLike
interface IReviewLike {
  user: mongoose.Types.ObjectId
  review: mongoose.Types.ObjectId
  createdAt: Date
}

// Schema cho ReviewLike
const ReviewLikeSchema = new Schema<IReviewLike>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
    },
    review: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'reviews',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Tạo compound index để đảm bảo user chỉ like một review một lần
ReviewLikeSchema.index({ user: 1, review: 1 }, { unique: true })

// Index để query nhanh
ReviewLikeSchema.index({ review: 1 }) // Đếm số likes của review
ReviewLikeSchema.index({ user: 1 }) // Lấy danh sách reviews user đã like

// Export model
export const ReviewLikeModel = mongoose.model<IReviewLike>('review_likes', ReviewLikeSchema)

// Export interface
export { IReviewLike }
