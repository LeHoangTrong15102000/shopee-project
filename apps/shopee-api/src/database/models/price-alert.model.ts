import mongoose, { Schema, Document } from 'mongoose'

export interface IPriceAlert extends Document {
  user_id: mongoose.Types.ObjectId
  product_id: mongoose.Types.ObjectId
  target_price: number
  current_price: number
  is_triggered: boolean
  is_active: boolean
  triggered_at?: Date
  createdAt: Date
  updatedAt: Date
}

const PriceAlertSchema = new Schema<IPriceAlert>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    product_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'products',
      required: true,
      index: true,
    },
    target_price: {
      type: Number,
      required: true,
      min: 0,
    },
    current_price: {
      type: Number,
      default: 0,
    },
    is_triggered: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    triggered_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

PriceAlertSchema.index({ user_id: 1, product_id: 1 })
PriceAlertSchema.index({ is_active: 1, is_triggered: 1 })

export const PriceAlertModel = mongoose.model<IPriceAlert>('price_alerts', PriceAlertSchema)
