import mongoose, { Schema } from 'mongoose'

export const PAYMENT_METHOD_TYPE = {
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer',
  E_WALLET: 'e_wallet',
  CREDIT_CARD: 'credit_card',
} as const

export type PaymentMethodTypeEnum = (typeof PAYMENT_METHOD_TYPE)[keyof typeof PAYMENT_METHOD_TYPE]

export interface IPaymentMethod {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  icon?: string
  type: PaymentMethodTypeEnum
  is_active: boolean
  sort_order: number
  instructions?: string
  createdAt?: Date
  updatedAt?: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    type: {
      type: String,
      enum: Object.values(PAYMENT_METHOD_TYPE),
      required: true,
    },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    instructions: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
)

PaymentMethodSchema.index({ is_active: 1, sort_order: 1 })

export const PaymentMethodModel = mongoose.model<IPaymentMethod>(
  'payment_methods',
  PaymentMethodSchema,
)
