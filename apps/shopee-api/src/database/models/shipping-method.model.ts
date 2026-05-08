import mongoose, { Schema } from 'mongoose'

export interface IShippingMethod {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  estimated_days_min: number
  estimated_days_max: number
  icon?: string
  is_active: boolean
  sort_order: number
  createdAt?: Date
  updatedAt?: Date
}

const ShippingMethodSchema = new Schema<IShippingMethod>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    estimated_days_min: { type: Number, required: true, min: 0 },
    estimated_days_max: { type: Number, required: true, min: 0 },
    icon: { type: String, trim: true },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

ShippingMethodSchema.index({ is_active: 1, sort_order: 1 })

export const ShippingMethodModel = mongoose.model<IShippingMethod>('shipping_methods', ShippingMethodSchema)
