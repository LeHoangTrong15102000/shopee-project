import { Types, FilterQuery } from 'mongoose'
import { PriceHistoryModel, IPriceHistory } from '@database/models/price-history.model'
import { PriceAlertModel, IPriceAlert } from '@database/models/price-alert.model'
import {
  IPriceRepository,
  IPriceHistoryItem,
  IPriceAlertItem,
  CreatePriceAlertDTO,
  PriceAlertFilterOptions,
} from './interfaces/price.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class PriceRepository implements IPriceRepository {
  // Price History
  async findPriceHistory(productId: string | Types.ObjectId, days: number): Promise<IPriceHistoryItem[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return PriceHistoryModel.find({
      product_id: new Types.ObjectId(productId.toString()),
      recorded_at: { $gte: startDate },
    })
      .sort({ recorded_at: 1 })
      .lean<IPriceHistoryItem[]>()
  }

  // Price Alerts
  async findAlertsByUser(
    userId: string | Types.ObjectId,
    filters: PriceAlertFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IPriceAlertItem>> {
    const { page, limit, sort } = pagination
    const skip = (page - 1) * limit

    const filter: FilterQuery<IPriceAlert> = { user_id: new Types.ObjectId(userId.toString()) }
    if (filters.is_active !== undefined) {
      filter.is_active = filters.is_active
    }
    if (filters.is_triggered !== undefined) {
      filter.is_triggered = filters.is_triggered
    }

    const [data, total] = await Promise.all([
      PriceAlertModel.find(filter)
        .populate('product_id', 'name image price price_before_discount')
        .sort(sort || { created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IPriceAlertItem[]>(),
      PriceAlertModel.countDocuments(filter),
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

  async findActiveAlertByUserAndProduct(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId
  ): Promise<IPriceAlertItem | null> {
    return PriceAlertModel.findOne({
      user_id: new Types.ObjectId(userId.toString()),
      product_id: new Types.ObjectId(productId.toString()),
      is_active: true,
    }).lean<IPriceAlertItem | null>()
  }

  async createAlert(data: CreatePriceAlertDTO): Promise<IPriceAlertItem> {
    const alert = new PriceAlertModel({
      user_id: new Types.ObjectId(data.user_id.toString()),
      product_id: new Types.ObjectId(data.product_id.toString()),
      target_price: data.target_price,
      current_price: data.current_price,
      is_triggered: false,
      is_active: true,
      created_at: new Date(),
    })
    const saved = await alert.save()
    return saved.toObject() as IPriceAlertItem
  }

  async deleteAlertByIdAndUser(
    alertId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IPriceAlertItem | null> {
    return PriceAlertModel.findOneAndDelete({
      _id: new Types.ObjectId(alertId.toString()),
      user_id: new Types.ObjectId(userId.toString()),
    }).lean<IPriceAlertItem | null>()
  }
}

