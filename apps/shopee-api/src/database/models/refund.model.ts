import mongoose, { Schema } from 'mongoose'
import { OrderStatusType } from './order.model'

export const REFUND_REASON = {
  DEFECTIVE: 'DEFECTIVE',
  WRONG_ITEM: 'WRONG_ITEM',
  NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED',
  CHANGED_MIND: 'CHANGED_MIND',
  OTHER: 'OTHER',
} as const

export type RefundReasonType = (typeof REFUND_REASON)[keyof typeof REFUND_REASON]

export const REFUND_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type RefundStatusType = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS]

export interface IRefund {
  _id: mongoose.Types.ObjectId
  order_id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  reason: RefundReasonType
  reason_detail: string
  evidence: string[]
  requested_amount: number
  approved_amount?: number
  status: RefundStatusType
  /** Captures the order status before refund was requested — needed to revert on cancel/reject */
  previous_order_status: OrderStatusType
  admin_id?: mongoose.Types.ObjectId
  admin_notes?: string
  rejection_reason?: string
  processed_at?: Date
  completed_at?: Date
  /** Stripe refund ID (re_xxx) or MoMo transId — set after gateway call succeeds */
  gateway_refund_id?: string
  /** Determined by payment_method: auto for credit_card/momo, manual for others */
  refund_method?: 'auto' | 'manual'
  /** Gateway error message stored when gateway call fails */
  failure_reason?: string
  /** Number of gateway call attempts — incremented on each failure */
  retry_count?: number
  createdAt?: Date
  updatedAt?: Date
}

const RefundSchema = new Schema<IRefund>(
  {
    order_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'orders', required: true },
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    reason: {
      type: String,
      enum: Object.values(REFUND_REASON),
      required: true,
    },
    reason_detail: { type: String, required: true },
    evidence: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Evidence cannot have more than 5 images',
      },
    },
    requested_amount: { type: Number, required: true, min: 0 },
    approved_amount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: Object.values(REFUND_STATUS),
      default: REFUND_STATUS.PENDING,
    },
    previous_order_status: { type: String, required: true },
    admin_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
    admin_notes: { type: String },
    rejection_reason: { type: String },
    processed_at: { type: Date },
    completed_at: { type: Date },
    gateway_refund_id: { type: String },
    refund_method: { type: String, enum: ['auto', 'manual'], default: 'manual' },
    failure_reason: { type: String },
    retry_count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

// Unique index: one refund per order
RefundSchema.index({ order_id: 1 }, { unique: true })
RefundSchema.index({ user_id: 1 })
RefundSchema.index({ status: 1 })
RefundSchema.index({ createdAt: -1 })
RefundSchema.index({ gateway_refund_id: 1 }, { sparse: true })

export const RefundModel = mongoose.model<IRefund>('refunds', RefundSchema)
