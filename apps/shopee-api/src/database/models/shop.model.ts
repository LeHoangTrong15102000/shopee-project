import mongoose, { Schema } from 'mongoose'

export type ShopStatus = 'pending' | 'active' | 'suspended' | 'banned'

export interface IShop {
  _id: mongoose.Types.ObjectId
  name: string
  avatar: string
  coverImage: string
  description: string
  rating: number
  responseRate: number
  responseTime: string
  followerCount: number
  productCount: number
  joinedDate: Date
  followers: mongoose.Types.ObjectId[]
  status: ShopStatus
  status_reason?: string
  createdAt: Date
  updatedAt: Date
}

const ShopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, maxlength: 200 },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    description: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    responseTime: { type: String, default: 'within a few hours' },
    followerCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now },
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'banned'],
      default: 'active',
      index: true,
    },
    status_reason: { type: String, default: '' },
  },
  { timestamps: true },
)

ShopSchema.index({ name: 'text' })
ShopSchema.index({ rating: -1 })

export const ShopModel = mongoose.model<IShop>('shops', ShopSchema)
