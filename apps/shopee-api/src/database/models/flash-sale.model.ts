import mongoose, { Schema } from 'mongoose'
import { IFlashSale, FlashSaleStatus } from '../../@types/models.type'

const FLASH_SALE_STATUSES: FlashSaleStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
  'CANCELLED',
]

const FlashSaleProductSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
    skuId: { type: Schema.Types.ObjectId, ref: 'skus' },
    originalPrice: { type: Number, required: true, min: 0 },
    flashPrice: { type: Number, required: true, min: 0 },
    totalQuantity: { type: Number, required: true, min: 1 },
    soldQuantity: { type: Number, required: true, default: 0, min: 0 },
    limitPerUser: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: FLASH_SALE_STATUSES,
      required: true,
      default: 'DRAFT',
    },
    products: { type: [FlashSaleProductSchema], required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
FlashSaleSchema.index({ status: 1 })
FlashSaleSchema.index({ startTime: 1 })
FlashSaleSchema.index({ endTime: 1 })
FlashSaleSchema.index({ 'products.productId': 1 })

// Virtual: isActive — true when status is ACTIVE and now is between startTime and endTime
FlashSaleSchema.virtual('isActive').get(function (this: IFlashSale) {
  if (this.status !== 'ACTIVE') return false
  const now = new Date()
  return now >= this.startTime && now <= this.endTime
})

export const FlashSaleModel = mongoose.model<IFlashSale>('flash_sales', FlashSaleSchema)
