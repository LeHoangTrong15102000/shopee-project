import mongoose, { Schema } from 'mongoose'

export interface IPasswordReset {
  _id: mongoose.Types.ObjectId
  email: string
  token: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-delete when expires_at is reached
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

export const PasswordResetModel = mongoose.model<IPasswordReset>(
  'password_resets',
  PasswordResetSchema,
)
