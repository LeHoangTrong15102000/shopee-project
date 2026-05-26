import mongoose, { Schema } from 'mongoose'

export type BundleDiscountType = 'percentage' | 'fixed' | 'buy_x_get_y'

export interface IBundle {
  _id?: mongoose.Types.ObjectId
  name: string
  description?: string
  productIds: mongoose.Types.ObjectId[]
  discountType: BundleDiscountType
  discountValue: number
  minQuantity: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  maxRedemptions?: number
  currentRedemptions: number
  createdAt: Date
  updatedAt: Date
}

const BundleSchema = new Schema<IBundle>(
  {
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    productIds: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'products',
        required: true,
      },
    ],
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed', 'buy_x_get_y'],
    },
    discountValue: { type: Number, required: true, min: 0 },
    minQuantity: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    maxRedemptions: { type: Number, min: 1 },
    currentRedemptions: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
)

// Index for finding active, non-expired bundles efficiently
BundleSchema.index({ isActive: 1, endDate: 1 })

// Index for finding bundles that contain a specific product
BundleSchema.index({ productIds: 1 })

export const BundleModel = mongoose.model<IBundle>('bundles', BundleSchema)
