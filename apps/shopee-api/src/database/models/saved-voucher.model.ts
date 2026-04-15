import mongoose, { Schema } from 'mongoose'

export const VOUCHER_STATUS = {
  AVAILABLE: 'available',
  USED: 'used',
  EXPIRED: 'expired',
} as const

export type VoucherStatus = (typeof VOUCHER_STATUS)[keyof typeof VOUCHER_STATUS]

interface ISavedVoucher {
  user: mongoose.Types.ObjectId
  voucher: mongoose.Types.ObjectId
  saved_at: Date
  status: VoucherStatus
  used_at?: Date
  order_id?: mongoose.Types.ObjectId
}

const SavedVoucherSchema = new Schema<ISavedVoucher>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    voucher: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'vouchers',
      required: true,
      index: true,
    },
    saved_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(VOUCHER_STATUS),
      default: VOUCHER_STATUS.AVAILABLE,
      index: true,
    },
    used_at: {
      type: Date,
    },
    order_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'orders',
    },
  },
  {
    timestamps: false,
  },
)

SavedVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true })
SavedVoucherSchema.index({ user: 1, status: 1 })

export const SavedVoucherModel = mongoose.model<ISavedVoucher>('saved_vouchers', SavedVoucherSchema)

export { ISavedVoucher }
