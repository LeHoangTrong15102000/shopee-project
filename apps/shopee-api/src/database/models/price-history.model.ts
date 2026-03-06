import mongoose, { Schema } from 'mongoose'

export interface IPriceHistory {
  _id: mongoose.Types.ObjectId
  product_id: mongoose.Types.ObjectId
  price: number
  price_before_discount: number
  recorded_at: Date
}

const PriceHistorySchema = new Schema<IPriceHistory>(
  {
    product_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'products',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    price_before_discount: {
      type: Number,
      required: true,
      min: 0,
    },
    recorded_at: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
)

PriceHistorySchema.index({ product_id: 1, recorded_at: -1 })

export const PriceHistoryModel = mongoose.model<IPriceHistory>('price_histories', PriceHistorySchema)

