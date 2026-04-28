import mongoose from 'mongoose'
import { GpsTrackingUpdateModel, IGpsTrackingUpdate } from '@database/models/gps-tracking.model'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import { getIO } from '../socket/socket.init'

export class GpsTrackingService extends BaseService {
  async getOrderTracking(orderId: string): Promise<IGpsTrackingUpdate> {
    if (!this.isValidObjectId(orderId)) {
      throw new ValidationError('Invalid order id')
    }
    const tracking = await GpsTrackingUpdateModel.findOne({
      orderId: new mongoose.Types.ObjectId(orderId),
    })
      .sort({ timestamp: -1 })
      .lean()

    if (!tracking) throw new NotFoundError('Tracking', orderId)
    return tracking
  }

  async updateTracking(
    orderId: string,
    data: {
      status: string
      location: { lat: number; lng: number }
      driverName: string
      driverPhone: string
      vehicleInfo: string
      estimatedArrival: Date
    },
  ): Promise<IGpsTrackingUpdate> {
    if (!this.isValidObjectId(orderId)) {
      throw new ValidationError('Invalid order id')
    }

    const update = await GpsTrackingUpdateModel.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      ...data,
      timestamp: new Date(),
    })

    // Emit WebSocket event to order room
    const io = getIO()
    if (io) {
      const room = `order:${orderId}`
      io.to(room).emit('tracking:update', update.toObject())
    }

    return update.toObject()
  }
}
