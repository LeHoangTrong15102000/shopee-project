import mongoose, { Schema } from 'mongoose'
import { STATUS_PURCHASE } from '@constants/purchase'

const PurchaseSchema = new Schema(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
    product: { type: mongoose.SchemaTypes.ObjectId, ref: 'products' },
    sku: { type: mongoose.SchemaTypes.ObjectId, ref: 'skus' },
    buy_count: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    status: { type: Number, default: STATUS_PURCHASE.WAIT_FOR_CONFIRMATION },
  },
  {
    timestamps: true,
  }
)

// Index for querying purchases by user
PurchaseSchema.index({ user: 1 })

// Index for filtering purchases by status
PurchaseSchema.index({ status: 1 })

// Compound index for querying user's purchases with specific status
PurchaseSchema.index({ user: 1, status: 1 })

// Index for sorting purchases by creation date
PurchaseSchema.index({ createdAt: -1 })

export const PurchaseModel = mongoose.model('purchases', PurchaseSchema)
