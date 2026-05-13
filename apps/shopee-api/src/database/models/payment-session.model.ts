import mongoose, { Schema } from 'mongoose'

export const PAYMENT_SESSION_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const

export type PaymentSessionStatusType = (typeof PAYMENT_SESSION_STATUS)[keyof typeof PAYMENT_SESSION_STATUS]

export interface IPaymentSessionCartItem {
  productId: mongoose.Types.ObjectId
  skuId?: mongoose.Types.ObjectId
  buyCount: number
  price: number
}

export interface IPaymentSession {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  cartItems: IPaymentSessionCartItem[]
  shippingAddressId: mongoose.Types.ObjectId
  shippingMethodId: string
  paymentMethod: string
  eWalletProvider: string
  voucherCode?: string
  coinsUsed?: number
  note?: string
  amount: number
  status: PaymentSessionStatusType
  payment_url?: string
  payment_id?: string
  provider_transaction_id?: string
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

const PaymentSessionCartItemSchema = new Schema<IPaymentSessionCartItem>(
  {
    productId: { type: mongoose.SchemaTypes.ObjectId, ref: 'products', required: true },
    skuId: { type: mongoose.SchemaTypes.ObjectId, ref: 'skus' },
    buyCount: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const PaymentSessionSchema = new Schema<IPaymentSession>(
  {
    userId: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    cartItems: { type: [PaymentSessionCartItemSchema], required: true },
    shippingAddressId: { type: mongoose.SchemaTypes.ObjectId, ref: 'addresses', required: true },
    shippingMethodId: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    eWalletProvider: { type: String, required: true },
    voucherCode: { type: String },
    coinsUsed: { type: Number, default: 0 },
    note: { type: String },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(PAYMENT_SESSION_STATUS),
      default: PAYMENT_SESSION_STATUS.PENDING,
    },
    payment_url: { type: String },
    payment_id: { type: String },
    provider_transaction_id: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// TTL index: MongoDB automatically removes documents when expiresAt is reached
PaymentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Compound index for efficient user+status queries
PaymentSessionSchema.index({ userId: 1, status: 1 })

export const PaymentSessionModel = mongoose.model<IPaymentSession>(
  'payment_sessions',
  PaymentSessionSchema,
)
