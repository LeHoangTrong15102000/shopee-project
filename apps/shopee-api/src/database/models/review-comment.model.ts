import mongoose, { Schema } from 'mongoose'

// Interface cho ReviewComment
interface IReviewComment {
  user: mongoose.Types.ObjectId
  review: mongoose.Types.ObjectId
  content: string
  parent_comment?: mongoose.Types.ObjectId // null = comment gốc, có giá trị = reply
  level: number // 0 = comment gốc, 1+ = reply level
  replies_count: number
  createdAt: Date
  updatedAt: Date
}

// Schema cho ReviewComment
const ReviewCommentSchema = new Schema<IReviewComment>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    review: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'reviews',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    parent_comment: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'review_comments',
      default: null,
      index: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // Giới hạn tối đa 3 level nested comments
    },
    replies_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Tạo compound indexes
ReviewCommentSchema.index({ review: 1, parent_comment: 1, createdAt: 1 }) // Lấy comments theo thứ tự
ReviewCommentSchema.index({ parent_comment: 1, createdAt: 1 }) // Lấy replies của comment
ReviewCommentSchema.index({ user: 1, createdAt: -1 }) // Lấy comments của user

// Middleware để update replies_count khi có comment mới
ReviewCommentSchema.pre('save', async function () {
  if (this.parent_comment && this.isNew) {
    await ReviewCommentModel.findByIdAndUpdate(this.parent_comment, {
      $inc: { replies_count: 1 },
    })
  }
})

// Export model
export const ReviewCommentModel = mongoose.model<IReviewComment>(
  'review_comments',
  ReviewCommentSchema,
)

// Export interface
export { IReviewComment }
