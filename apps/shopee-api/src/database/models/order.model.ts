import mongoose, { Schema } from 'mongoose'

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const PAYMENT_METHOD = {
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer',
  E_WALLET: 'e_wallet',
  CREDIT_CARD: 'credit_card',
} as const

export type PaymentMethodType = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  buy_count: number
  price: number
  price_before_discount: number
  sku?: mongoose.Types.ObjectId
}

export interface IShippingAddress {
  full_name: string
  phone: string
  province: string
  district: string
  ward: string
  street: string
}

export interface IShippingMethod {
  id: string
  name: string
  price: number
  estimated_days?: string
}

export interface IOrder {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  items: IOrderItem[]
  shipping_address: IShippingAddress
  shipping_method: IShippingMethod
  payment_method: PaymentMethodType
  subtotal: number
  shipping_fee: number
  discount: number
  coins_used: number
  coins_discount: number
  total: number
  status: OrderStatusType
  voucher_code?: string
  note?: string
  cancel_reason?: string
  cancelled_at?: Date
  confirmed_at?: Date
  processing_at?: Date
  shipped_at?: Date
  delivered_at?: Date
  returned_at?: Date
  return_reason?: string
  createdAt?: Date
  updatedAt?: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: mongoose.SchemaTypes.ObjectId, ref: 'products', required: true },
    buy_count: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    price_before_discount: { type: Number, required: true },
    sku: { type: mongoose.SchemaTypes.ObjectId, ref: 'skus' },
  },
  { _id: false }
)

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    street: { type: String, required: true },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    items: [OrderItemSchema],
    shipping_address: ShippingAddressSchema,
    shipping_method: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      estimated_days: { type: String },
    },
    payment_method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    subtotal: { type: Number, required: true },
    shipping_fee: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    coins_used: { type: Number, default: 0 },
    coins_discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    voucher_code: { type: String },
    note: { type: String, maxlength: 500 },
    cancel_reason: { type: String },
    cancelled_at: { type: Date },
    confirmed_at: { type: Date },
    processing_at: { type: Date },
    shipped_at: { type: Date },
    delivered_at: { type: Date },
    returned_at: { type: Date },
    return_reason: { type: String },
  },
  {
    timestamps: true,
  }
)

OrderSchema.index({ user: 1, status: 1 })
OrderSchema.index({ user: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })

export const OrderModel = mongoose.model<IOrder>('orders', OrderSchema)
