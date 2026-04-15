import mongoose, { Schema } from 'mongoose'

export const CARRIER = {
  GHN: 'ghn',
  GHTK: 'ghtk',
  VIETTEL_POST: 'viettel_post',
  JT: 'j&t',
  OTHER: 'other',
} as const

export type CarrierType = (typeof CARRIER)[keyof typeof CARRIER]

export const TRACKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export type TrackingStatus = (typeof TRACKING_STATUS)[keyof typeof TRACKING_STATUS]

export interface ITrackingEvent {
  status: string
  description: string
  location?: string
  timestamp: Date
}

export interface IShippingAddress {
  name: string
  phone: string
  address: string
  province: string
  district: string
  ward: string
}

export interface IOrderTracking {
  _id: mongoose.Types.ObjectId
  order_id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  tracking_number: string
  carrier: CarrierType
  status: TrackingStatus
  estimated_delivery: Date
  actual_delivery?: Date
  timeline: ITrackingEvent[]
  shipping_address: IShippingAddress
  createdAt: Date
  updatedAt: Date
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
)

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
  },
  { _id: false },
)

const OrderTrackingSchema = new Schema<IOrderTracking>(
  {
    order_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'purchases',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    tracking_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    carrier: {
      type: String,
      enum: Object.values(CARRIER),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRACKING_STATUS),
      default: TRACKING_STATUS.PENDING,
      index: true,
    },
    estimated_delivery: {
      type: Date,
      required: true,
    },
    actual_delivery: {
      type: Date,
    },
    timeline: {
      type: [TrackingEventSchema],
      default: [],
    },
    shipping_address: {
      type: ShippingAddressSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

OrderTrackingSchema.index({ user_id: 1, createdAt: -1 })
OrderTrackingSchema.index({ order_id: 1, user_id: 1 })

export const OrderTrackingModel = mongoose.model<IOrderTracking>(
  'order_trackings',
  OrderTrackingSchema,
)
