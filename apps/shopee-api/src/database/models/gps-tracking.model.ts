import mongoose, { Schema } from 'mongoose'

export interface IGpsLocation {
  lat: number
  lng: number
}

export interface IGpsTrackingUpdate {
  _id: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  status: string
  location: IGpsLocation
  driverName: string
  driverPhone: string
  vehicleInfo: string
  estimatedArrival: Date
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}

const GpsTrackingUpdateSchema = new Schema<IGpsTrackingUpdate>(
  {
    orderId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'purchases',
      required: true,
      index: true,
    },
    status: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    vehicleInfo: { type: String, default: '' },
    estimatedArrival: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

GpsTrackingUpdateSchema.index({ orderId: 1, timestamp: -1 })

export const GpsTrackingUpdateModel = mongoose.model<IGpsTrackingUpdate>(
  'gps_tracking_updates',
  GpsTrackingUpdateSchema,
)
