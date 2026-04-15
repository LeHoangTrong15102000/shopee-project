import mongoose, { Schema } from 'mongoose'

interface IAnswer {
  _id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  user_name: string
  user_avatar?: string
  is_seller: boolean
  answer: string
  likes_count: number
  liked_by: mongoose.Types.ObjectId[]
  created_at: Date
}

interface IQuestion {
  product_id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  user_name: string
  user_avatar?: string
  question: string
  answers: IAnswer[]
  likes_count: number
  liked_by: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const AnswerSchema = new Schema<IAnswer>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
    },
    user_name: {
      type: String,
      required: true,
      maxlength: 160,
    },
    user_avatar: {
      type: String,
      maxlength: 1000,
    },
    is_seller: {
      type: Boolean,
      default: false,
    },
    answer: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    liked_by: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users',
      },
    ],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
)

const QuestionSchema = new Schema<IQuestion>(
  {
    product_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'products',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    user_name: {
      type: String,
      required: true,
      maxlength: 160,
    },
    user_avatar: {
      type: String,
      maxlength: 1000,
    },
    question: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    answers: [AnswerSchema],
    likes_count: {
      type: Number,
      default: 0,
    },
    liked_by: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users',
      },
    ],
  },
  {
    timestamps: true,
  },
)

QuestionSchema.index({ product_id: 1, createdAt: -1 })
QuestionSchema.index({ user_id: 1, createdAt: -1 })
QuestionSchema.index({ likes_count: -1 })

export const QuestionModel = mongoose.model<IQuestion>('questions', QuestionSchema)
export { IQuestion, IAnswer }
