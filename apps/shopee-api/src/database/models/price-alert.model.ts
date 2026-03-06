import mongoose, { Schema } from 'mongoose'

export interface IPriceAlert {
  _id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  product_id: mongoose.Types.ObjectId
  target_price: number
  current_price: number
  is_triggered: boolean
  is_active: boolean
  created_at: Date
  triggered_at?: Date
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
      required: true,
      min: 0,
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
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    triggered_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
)

PriceAlertSchema.index({ user_id: 1, is_active: 1 })
PriceAlertSchema.index({ product_id: 1, is_active: 1, is_triggered: 1 })
PriceAlertSchema.index({ user_id: 1, product_id: 1 })

export const PriceAlertModel = mongoose.model<IPriceAlert>('price_alerts', PriceAlertSchema)

