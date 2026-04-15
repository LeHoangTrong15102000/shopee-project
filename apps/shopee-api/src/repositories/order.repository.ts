import { Types } from 'mongoose'
import { OrderModel, IOrder, OrderStatusType } from '@database/models/order.model'
import { OrderTrackingModel, IOrderTracking } from '@database/models/order-tracking.model'
import {
  IOrderRepository,
  CreateOrderDTO,
  OrderFilterOptions,
} from './interfaces/order.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class OrderRepository implements IOrderRepository {
  async findByUser(
    filters: OrderFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IOrder>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const query: { user: Types.ObjectId | string; status?: string } = { user: filters.user_id }
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status
    }

    const [data, total] = await Promise.all([
      OrderModel.find(query)
        .populate('items.product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IOrder[]>(),
      OrderModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findById(orderId: string | Types.ObjectId): Promise<IOrder | null> {
    return OrderModel.findById(orderId).populate('items.product').lean<IOrder | null>()
  }

  async findByIdAndUser(
    orderId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IOrder | null> {
    return OrderModel.findOne({ _id: orderId, user: userId })
      .populate('items.product')
      .lean<IOrder | null>()
  }

  async create(data: CreateOrderDTO): Promise<IOrder> {
    const order = await OrderModel.create(data)
    return OrderModel.findById(order._id)
      .populate('items.product')
      .lean<IOrder>() as Promise<IOrder>
  }

  async updateStatus(
    orderId: string | Types.ObjectId,
    status: OrderStatusType,
    additionalData?: Partial<IOrder>,
  ): Promise<IOrder | null> {
    return OrderModel.findByIdAndUpdate(orderId, { status, ...additionalData }, { new: true })
      .populate('items.product')
      .lean<IOrder | null>()
  }

  async findTrackingByOrderAndUser(
    orderId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IOrderTracking | null> {
    return OrderTrackingModel.findOne({
      order_id: orderId,
      user_id: userId,
    }).lean<IOrderTracking | null>()
  }

  async findTrackingByNumber(trackingNumber: string): Promise<IOrderTracking | null> {
    return OrderTrackingModel.findOne({ tracking_number: trackingNumber })
      .select('-user_id')
      .lean<IOrderTracking | null>()
  }

  async findAllWithFilters(
    filters: {
      status?: string
      payment_method?: string
      user_id?: string
      search?: string
      start_date?: string
      end_date?: string
    },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ): Promise<PaginatedResult<IOrder>> {
    const { page, limit, sort_by = 'createdAt', order = 'desc' } = pagination
    const skip = (page - 1) * limit

    const query: Record<string, any> = {}

    if (filters.status) query.status = filters.status
    if (filters.payment_method) query.payment_method = filters.payment_method
    if (filters.user_id) query.user = new Types.ObjectId(filters.user_id)

    if (filters.start_date || filters.end_date) {
      query.createdAt = {}
      if (filters.start_date) query.createdAt.$gte = new Date(filters.start_date)
      if (filters.end_date) query.createdAt.$lte = new Date(filters.end_date + 'T23:59:59.999Z')
    }

    // Search by order ID (partial match on _id string) or populate user and search
    let pipeline: any[] = [{ $match: query }]

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i')
      pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [{ 'user_info.name': searchRegex }, { 'user_info.email': searchRegex }],
          },
        },
      ]
    }

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [countResult, data] = await Promise.all([
      OrderModel.aggregate([...pipeline, { $count: 'total' }]),
      OrderModel.aggregate([
        ...pipeline,
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit },
      ]).then(async (orders) => {
        // Populate items.product and user
        return OrderModel.populate(orders, [
          { path: 'items.product', select: 'name image price' },
          { path: 'user', select: 'name email avatar' },
        ]) as Promise<IOrder[]>
      }),
    ])

    const total = countResult[0]?.total || 0

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async countByStatus(): Promise<Array<{ _id: string; count: number }>> {
    return OrderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  }
}
