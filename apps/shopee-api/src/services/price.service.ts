import { Types } from 'mongoose'
import { PriceAlertModel } from '@database/models/price-alert.model'
import { PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError } from './base.service'

interface PriceAlertFilters {
  user_id?: string
  product_id?: string
  status?: 'active' | 'triggered' | 'expired'
}

export class PriceService extends BaseService {
  // ─── Admin Methods ──────────────────────────────────────────────

  async adminGetAlerts(
    filters: PriceAlertFilters,
    pagination: PaginationOptions,
  ) {
    const { page, limit } = this.normalizePagination(pagination)
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = {}
    if (filters.user_id) query.user_id = new Types.ObjectId(filters.user_id)
    if (filters.product_id) query.product_id = new Types.ObjectId(filters.product_id)
    if (filters.status === 'active') {
      query.is_active = true
      query.is_triggered = false
    } else if (filters.status === 'triggered') {
      query.is_triggered = true
    } else if (filters.status === 'expired') {
      query.is_active = false
      query.is_triggered = false
    }

    const [data, total] = await Promise.all([
      PriceAlertModel.find(query)
        .populate('user_id', 'name email avatar')
        .populate('product_id', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PriceAlertModel.countDocuments(query),
    ])

    const alerts = data.map((a: any) => ({
      _id: a._id,
      user: a.user_id,
      product: a.product_id,
      target_price: a.target_price,
      current_price: a.current_price,
      is_triggered: a.is_triggered,
      is_active: a.is_active,
      triggered_at: a.triggered_at,
      createdAt: a.createdAt,
    }))

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  async adminGetAlertStats() {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const [total_active, triggered_today, expired, mostWatched] = await Promise.all([
      PriceAlertModel.countDocuments({ is_active: true, is_triggered: false }),
      PriceAlertModel.countDocuments({ is_triggered: true, triggered_at: { $gte: today } }),
      PriceAlertModel.countDocuments({ is_active: false, is_triggered: false }),
      PriceAlertModel.aggregate([
        { $group: { _id: '$product_id', alert_count: { $sum: 1 } } },
        { $sort: { alert_count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
        {
          $project: {
            _id: 0,
            product_id: '$_id',
            product_name: '$product.name',
            product_image: { $arrayElemAt: ['$product.images', 0] },
            alert_count: 1,
          },
        },
      ]),
    ])

    return {
      total_active,
      triggered_today,
      expired,
      most_watched_products: mostWatched,
    }
  }

  async adminDeleteAlert(alertId: string) {
    if (!this.isValidObjectId(alertId)) {
      throw new NotFoundError('PriceAlert', alertId)
    }
    const result = await PriceAlertModel.findByIdAndDelete(alertId).lean()
    if (!result) {
      throw new NotFoundError('PriceAlert', alertId)
    }
    return result
  }

  // ─── User Methods ────────────────────────────────────────────────

  async getPriceHistory(_productId: string, _days = 30): Promise<[]> {
    return []
  }

  async createPriceAlert(userId: string, productId: string, targetPrice: number) {
    if (!this.isValidObjectId(userId) || !this.isValidObjectId(productId)) {
      throw new Error('Invalid ID format')
    }
    const alert = await PriceAlertModel.create({
      user_id: new Types.ObjectId(userId),
      product_id: new Types.ObjectId(productId),
      target_price: targetPrice,
    })
    return alert.toObject()
  }

  async getPriceAlerts(
    userId: string,
    filters: { is_active?: boolean; is_triggered?: boolean },
    pagination: PaginationOptions,
  ) {
    const { page, limit } = this.normalizePagination(pagination)
    const skip = (page - 1) * limit
    const query: Record<string, unknown> = { user_id: new Types.ObjectId(userId) }
    if (filters.is_active !== undefined) query.is_active = filters.is_active
    if (filters.is_triggered !== undefined) query.is_triggered = filters.is_triggered

    const [data, total] = await Promise.all([
      PriceAlertModel.find(query)
        .populate('product_id', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PriceAlertModel.countDocuments(query),
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

  async deletePriceAlert(userId: string, alertId: string) {
    if (!this.isValidObjectId(alertId)) return null
    const result = await PriceAlertModel.findOneAndDelete({
      _id: new Types.ObjectId(alertId),
      user_id: new Types.ObjectId(userId),
    }).lean()
    return result
  }
}
