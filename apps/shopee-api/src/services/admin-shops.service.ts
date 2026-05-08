import mongoose from 'mongoose'
import { ShopModel, ShopStatus } from '@database/models/shop.model'
import { ProductModel } from '@database/models/product.model'
import { OrderModel, ORDER_STATUS } from '@database/models/order.model'
import { BaseService, NotFoundError, ValidationError } from './base.service'

export class AdminShopsService extends BaseService {
  // ─── List shops (paginated, filterable) ──────────────────────────

  async listShops(params: {
    page?: number
    limit?: number
    status?: ShopStatus
    search?: string
    sort_by?: string
    order?: 'asc' | 'desc'
  }) {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (params.status) {
      filter.status = params.status
    }
    if (params.search) {
      filter.$text = { $search: params.search }
    }

    const sortField = params.sort_by ?? 'createdAt'
    const sortDir = params.order === 'asc' ? 1 : -1
    const sortOrder: Record<string, 1 | -1> = { [sortField]: sortDir }

    const [data, total] = await Promise.all([
      ShopModel.find(filter).sort(sortOrder).skip(skip).limit(limit).lean(),
      ShopModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ─── Get shop detail with computed stats ─────────────────────────

  async getShopDetail(shopId: string) {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }

    const shop = await ShopModel.findById(shopId).lean()
    if (!shop) throw new NotFoundError('Shop', shopId)

    const shopObjectId = new mongoose.Types.ObjectId(shopId)

    const [productsCount, revenueAgg] = await Promise.all([
      ProductModel.countDocuments({ shop_id: shopObjectId }),
      OrderModel.aggregate([
        {
          $match: {
            status: ORDER_STATUS.DELIVERED,
            'items.product': {
              $in: await ProductModel.find({ shop_id: shopObjectId }).distinct('_id'),
            },
          },
        },
        { $group: { _id: null, total_revenue: { $sum: '$total' } } },
      ]),
    ])

    const totalRevenue = revenueAgg[0]?.total_revenue ?? 0

    return {
      ...shop,
      stats: {
        products_count: productsCount,
        total_revenue: totalRevenue,
        followers_count: shop.followerCount,
        avg_rating: shop.rating,
      },
    }
  }

  // ─── Update shop status ───────────────────────────────────────────

  async updateShopStatus(shopId: string, status: ShopStatus, reason?: string) {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }

    const shop = await ShopModel.findById(shopId)
    if (!shop) throw new NotFoundError('Shop', shopId)

    const update: Record<string, unknown> = { status }
    if (reason !== undefined) {
      update.status_reason = reason
    }

    const updated = await ShopModel.findByIdAndUpdate(shopId, update, { new: true }).lean()
    return updated
  }

  // ─── Get shop products (paginated) ───────────────────────────────

  async getShopProducts(shopId: string, page = 1, limit = 20) {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }

    const shop = await ShopModel.findById(shopId).lean()
    if (!shop) throw new NotFoundError('Shop', shopId)

    const shopObjectId = new mongoose.Types.ObjectId(shopId)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      ProductModel.find({ shop_id: shopObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments({ shop_id: shopObjectId }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ─── Get shop revenue over time ───────────────────────────────────

  async getShopRevenue(shopId: string, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }

    const shop = await ShopModel.findById(shopId).lean()
    if (!shop) throw new NotFoundError('Shop', shopId)

    const shopObjectId = new mongoose.Types.ObjectId(shopId)
    const now = new Date()
    let startDate: Date
    let groupFormat: string

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        groupFormat = '%Y-%m-%d'
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupFormat = '%Y-%m-%d'
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        groupFormat = '%Y-W%V'
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        groupFormat = '%Y-%m'
        break
    }

    // Get product IDs for this shop
    const productIds = await ProductModel.find({ shop_id: shopObjectId }).distinct('_id')

    const revenueData = await OrderModel.aggregate([
      {
        $match: {
          status: ORDER_STATUS.DELIVERED,
          delivered_at: { $gte: startDate },
          'items.product': { $in: productIds },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$delivered_at' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ])

    return { period, data: revenueData }
  }
}
