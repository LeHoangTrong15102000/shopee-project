import mongoose, { Schema } from 'mongoose'

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE]

interface IVoucher {
  _id: mongoose.Types.ObjectId
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value: number
  max_discount?: number
  usage_limit: number
  used_count: number
  start_date: Date
  end_date: Date
  applicable_products?: mongoose.Types.ObjectId[]
  applicable_categories?: mongoose.Types.ObjectId[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discount_type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      required: true,
    },
    discount_value: {
      type: Number,
      required: true,
      min: 0,
    },
    min_order_value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    max_discount: {
      type: Number,
      min: 0,
    },
    usage_limit: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    used_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    start_date: {
      type: Date,
      required: true,
      index: true,
    },
    end_date: {
      type: Date,
      required: true,
      index: true,
    },
    applicable_products: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'products',
      },
    ],
    applicable_categories: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'categories',
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

VoucherSchema.index({ is_active: 1, start_date: 1, end_date: 1 })

export const VoucherModel = mongoose.model<IVoucher>('vouchers', VoucherSchema)

export { IVoucher }

