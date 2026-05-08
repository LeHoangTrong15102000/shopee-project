import mongoose from 'mongoose'
import { WishlistModel } from '@database/models/wishlist.model'
import { ProductModel } from '@database/models/product.model'
import { HOST } from '@utils/helper'
import { ROUTE_IMAGE } from '@constants/config'

export interface TopWishlistedProduct {
  product_id: string
  name: string
  image: string
  price: number
  quantity: number
  sold: number
  wishlist_count: number
}

export interface WishlistConversionItem {
  product_id: string
  name: string
  image: string
  price: number
  wishlist_count: number
  purchase_count: number
  conversion_rate: number
}

export interface WishlistTrendPoint {
  date: string
  count: number
}

function periodToDays(period: string): number | null {
  switch (period) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case 'all':
      return null
    default:
      return 30
  }
}

export class WishlistAnalyticsService {
  async getTopProducts(period: string): Promise<{ products: TopWishlistedProduct[]; total: number }> {
    const days = periodToDays(period)
    const matchStage: Record<string, unknown> = {}
    if (days !== null) {
      const since = new Date()
      since.setDate(since.getDate() - days)
      matchStage.addedAt = { $gte: since }
    }

    const baseMatch = Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []

    const pipeline: mongoose.PipelineStage[] = [
      ...baseMatch,
      {
        $group: {
          _id: '$product',
          wishlist_count: { $sum: 1 },
        },
      },
      { $sort: { wishlist_count: -1 } },
      { $limit: 30 },
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
          product_id: { $toString: '$_id' },
          name: '$product.name',
          image: '$product.image',
          price: '$product.price',
          quantity: '$product.quantity',
          sold: '$product.sold',
          wishlist_count: 1,
        },
      },
    ]

    // Count total wishlist entries across all products (not just top 30)
    const totalPipeline: mongoose.PipelineStage[] = [
      ...baseMatch,
      { $count: 'total' },
    ]

    const [results, totalResult] = await Promise.all([
      WishlistModel.aggregate(pipeline),
      WishlistModel.aggregate(totalPipeline),
    ])

    const total: number = totalResult[0]?.total ?? 0

    return {
      products: results.map((r) => ({
        ...r,
        image: r.image ? `${HOST}/${ROUTE_IMAGE}/${r.image}` : '',
      })),
      total,
    }
  }

  async getConversion(): Promise<WishlistConversionItem[]> {
    // Aggregate wishlist counts per product
    const wishlistCounts = await WishlistModel.aggregate([
      {
        $group: {
          _id: '$product',
          wishlist_count: { $sum: 1 },
        },
      },
      { $sort: { wishlist_count: -1 } },
      { $limit: 50 },
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
          product_id: { $toString: '$_id' },
          name: '$product.name',
          image: '$product.image',
          price: '$product.price',
          sold: '$product.sold',
          wishlist_count: 1,
        },
      },
    ])

    return wishlistCounts.map((r) => {
      const purchase_count = r.sold ?? 0
      const conversion_rate =
        r.wishlist_count > 0
          ? Math.min(100, Math.round((purchase_count / r.wishlist_count) * 100 * 10) / 10)
          : 0
      return {
        product_id: r.product_id,
        name: r.name,
        image: r.image ? `${HOST}/${ROUTE_IMAGE}/${r.image}` : '',
        price: r.price,
        wishlist_count: r.wishlist_count,
        purchase_count,
        conversion_rate,
      }
    })
  }

  async getTrends(period: string): Promise<WishlistTrendPoint[]> {
    const days = periodToDays(period) ?? 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const results = await WishlistModel.aggregate([
      { $match: { addedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$addedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ])

    return results
  }
}
