import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { RefundModel, IRefund, REFUND_STATUS } from '@database/models/refund.model'
import {
  IRefundRepository,
  CreateRefundDTO,
  UpdateRefundDTO,
  RefundFilterOptions,
} from './interfaces/refund.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class RefundRepository implements IRefundRepository {
  async findById(id: string | Types.ObjectId): Promise<IRefund | null> {
    return RefundModel.findById(id).lean<IRefund | null>()
  }

  async findOne(filter: FilterQuery<IRefund>): Promise<IRefund | null> {
    return RefundModel.findOne(filter).lean<IRefund | null>()
  }

  async find(filter: FilterQuery<IRefund>, options?: QueryOptions): Promise<IRefund[]> {
    return RefundModel.find(filter, null, options).lean<IRefund[]>()
  }

  async findPaginated(
    filter: FilterQuery<IRefund>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<IRefund>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      RefundModel.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IRefund[]>(),
      RefundModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async create(data: CreateRefundDTO): Promise<IRefund> {
    const refund = new RefundModel(data)
    const saved = await refund.save()
    return saved.toObject() as IRefund
  }

  async updateById(id: string | Types.ObjectId, data: UpdateRefundDTO): Promise<IRefund | null> {
    return RefundModel.findByIdAndUpdate(id, data, { new: true }).lean<IRefund | null>()
  }

  async updateMany(filter: FilterQuery<IRefund>, data: UpdateQuery<IRefund>): Promise<number> {
    const result = await RefundModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IRefund | null> {
    return RefundModel.findByIdAndDelete(id).lean<IRefund | null>()
  }

  async deleteMany(filter: FilterQuery<IRefund>): Promise<number> {
    const result = await RefundModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IRefund>): Promise<number> {
    return RefundModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IRefund>): Promise<boolean> {
    const doc = await RefundModel.exists(filter)
    return doc !== null
  }

  async findByOrderId(orderId: string | Types.ObjectId): Promise<IRefund | null> {
    return RefundModel.findOne({
      order_id: new Types.ObjectId(orderId.toString()),
    }).lean<IRefund | null>()
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IRefund>> {
    const filter: FilterQuery<IRefund> = { user_id: new Types.ObjectId(userId.toString()) }
    return this.findPaginated(filter, pagination)
  }

  async findPending(pagination: PaginationOptions): Promise<PaginatedResult<IRefund>> {
    const filter: FilterQuery<IRefund> = { status: REFUND_STATUS.PENDING }
    return this.findPaginated(filter, pagination)
  }

  async findWithFilters(
    filters: RefundFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IRefund>> {
    const filter: FilterQuery<IRefund> = {}

    if (filters.status) {
      filter.status = filters.status
    }

    if (filters.user_id) {
      filter.user_id = new Types.ObjectId(filters.user_id.toString())
    }

    if (filters.from || filters.to) {
      filter.createdAt = {}
      if (filters.from) {
        filter.createdAt.$gte = filters.from
      }
      if (filters.to) {
        filter.createdAt.$lte = filters.to
      }
    }

    return this.findPaginated(filter, pagination)
  }

  async findByIdPopulated(id: string | Types.ObjectId): Promise<IRefund | null> {
    return RefundModel.findById(id)
      .populate('order_id')
      .populate('user_id', '-password -password_reset_token -password_reset_expires')
      .lean<IRefund | null>()
  }

  async findProcessingByProvider(paymentMethod: string): Promise<IRefund[]> {
    // Aggregate: match PROCESSING refunds, join with orders, filter by payment_method
    return RefundModel.aggregate([
      { $match: { status: REFUND_STATUS.PROCESSING } },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.payment_method': paymentMethod } },
      { $project: { order: 0 } }, // remove joined order from result
    ])
  }
}
