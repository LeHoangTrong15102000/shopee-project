import mongoose, { Schema } from 'mongoose'

export const PAYMENT_PROVIDER = {
  MOMO: 'MOMO',
  VNPAY: 'VNPAY',
  COD: 'COD',
} as const

export type PaymentProviderType = (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER]

export const GATEWAY_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

export type GatewayPaymentStatusType = (typeof GATEWAY_PAYMENT_STATUS)[keyof typeof GATEWAY_PAYMENT_STATUS]

export interface IPayment {
  _id: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  provider: PaymentProviderType
  transactionId?: string          // transaction ID from provider
  amount: number                  // VND, integer
  currency: string                // always 'VND'
  status: GatewayPaymentStatusType
  idempotencyKey: string          // unique per payment attempt (UUID v4)
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  ipnPayload?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: mongoose.SchemaTypes.ObjectId, ref: 'orders', required: true },
    provider: {
      type: String,
      enum: Object.values(PAYMENT_PROVIDER),
      required: true,
    },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    status: {
      type: String,
      enum: Object.values(GATEWAY_PAYMENT_STATUS),
      default: GATEWAY_PAYMENT_STATUS.PENDING,
    },
    idempotencyKey: { type: String, required: true, unique: true },
    requestPayload: { type: Schema.Types.Mixed },
    responsePayload: { type: Schema.Types.Mixed },
    ipnPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

// idempotencyKey already indexed via unique: true
PaymentSchema.index({ orderId: 1 })
PaymentSchema.index({ transactionId: 1 }, { sparse: true })
PaymentSchema.index({ status: 1 })

export const PaymentModel = mongoose.model<IPayment>('payments', PaymentSchema)
