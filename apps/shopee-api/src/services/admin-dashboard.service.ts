import { OrderModel, ORDER_STATUS } from '@database/models/order.model'
import { ProductModel } from '@database/models/product.model'
import { UserModel } from '@database/models/user.model'
import { ReviewModel } from '@database/models/review.model'
import { CategoryModel } from '@database/models/category.model'
import { getDateRangeFromPeriod, getGroupingForPeriod, PeriodValue } from '@schemas/admin-common.schema'
import { getOnlineUserCount } from '../socket/managers/presence.manager'
import { BaseService } from './base.service'

export class AdminDashboardService extends BaseService {
  // ─── 1.3 getOverview ───────────────────────────────────────────

  async getOverview() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      revenueStats,
      orderStatusCounts,
      totalOrders,
      todayOrders,
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalProducts,
      outOfStock,
      lowStock,
      reviewsToday,
      reviewsWeek,
    ] = await Promise.all([
      // Revenue aggregation
      OrderModel.aggregate([
        { $match: { status: ORDER_STATUS.DELIVERED } },
        {
          $group: {
            _id: null,
            all_time: { $sum: '$total' },
            today: {
              $sum: { $cond: [{ $gte: ['$delivered_at', todayStart] }, '$total', 0] },
            },
            this_week: {
              $sum: { $cond: [{ $gte: ['$delivered_at', weekStart] }, '$total', 0] },
            },
            this_month: {
              $sum: { $cond: [{ $gte: ['$delivered_at', monthStart] }, '$total', 0] },
            },
          },
        },
      ]),
      // Order counts by status
      OrderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: todayStart } }),
      UserModel.countDocuments({ createdAt: { $gte: weekStart } }),
      UserModel.countDocuments({ createdAt: { $gte: monthStart } }),
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ quantity: 0 }),
      ProductModel.countDocuments({ quantity: { $gt: 0, $lt: 10 } }),
      ReviewModel.countDocuments({ createdAt: { $gte: todayStart } }),
      ReviewModel.countDocuments({ createdAt: { $gte: weekStart } }),
    ])

    const revenue = revenueStats[0] || { all_time: 0, today: 0, this_week: 0, this_month: 0 }

    const statusMap: Record<string, number> = {}
    for (const s of orderStatusCounts) {
      statusMap[s._id] = s.count
    }

    const hoursElapsed = Math.max(1, (now.getTime() - todayStart.getTime()) / (1000 * 60 * 60))

    return {
      revenue: {
        today: revenue.today,
        this_week: revenue.this_week,
        this_month: revenue.this_month,
        all_time: revenue.all_time,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        orders_per_hour: Math.round((todayOrders / hoursElapsed) * 100) / 100,
        by_status: {
          pending: statusMap[ORDER_STATUS.PENDING] || 0,
          confirmed: statusMap[ORDER_STATUS.CONFIRMED] || 0,
          processing: statusMap[ORDER_STATUS.PROCESSING] || 0,
          shipping: statusMap[ORDER_STATUS.SHIPPING] || 0,
          delivered: statusMap[ORDER_STATUS.DELIVERED] || 0,
          cancelled: statusMap[ORDER_STATUS.CANCELLED] || 0,
          returned: statusMap[ORDER_STATUS.RETURNED] || 0,
        },
      },
      users: {
        total: totalUsers,
        new_today: newUsersToday,
        new_this_week: newUsersWeek,
        new_this_month: newUsersMonth,
        active_users: getOnlineUserCount(),
      },
      products: {
        total: totalProducts,
        out_of_stock: outOfStock,
        low_stock: lowStock,
      },
      reviews: {
        today: reviewsToday,
        this_week: reviewsWeek,
      },
    }
  }

  // ─── 1.4 getRevenue ────────────────────────────────────────────

  async getRevenue(period?: PeriodValue, startDate?: string, endDate?: string) {
    const { start, end } = getDateRangeFromPeriod(period, startDate, endDate)
    const { format } = getGroupingForPeriod(period)

    // Current period revenue
    const timeSeries = await OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$delivered_at' } },
          revenue: { $sum: '$total' },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, order_count: 1 } },
    ])

    const totalRevenue = timeSeries.reduce((sum: number, d: any) => sum + d.revenue, 0)

    // Previous period for growth rate
    const periodMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - periodMs)
    const prevEnd = new Date(start.getTime() - 1)

    const prevResult = await OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ])

    const prevRevenue = prevResult[0]?.revenue || 0
    const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return {
      total_revenue: totalRevenue,
      growth_rate: Math.round(growthRate * 100) / 100,
      data: timeSeries,
    }
  }

  // ─── 1.5 getRevenueByCategory ──────────────────────────────────

  async getRevenueByCategory(period?: PeriodValue) {
    const { start, end } = getDateRangeFromPeriod(period)

    const result = await OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product_info',
        },
      },
      { $unwind: '$product_info' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product_info.category',
          foreignField: '_id',
          as: 'category_info',
        },
      },
      { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product_info.category',
          category_name: { $first: { $ifNull: ['$category_info.name', 'Không phân loại'] } },
          revenue: { $sum: { $multiply: ['$items.price', '$items.buy_count'] } },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    const totalRevenue = result.reduce((sum: number, r: any) => sum + r.revenue, 0)

    return result.map((r: any) => ({
      category_id: r._id?.toString() || null,
      category_name: r.category_name,
      revenue: r.revenue,
      order_count: r.order_count,
      percentage: totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 10000) / 100 : 0,
    }))
  }

  // ─── 1.6 getRevenueByProduct ───────────────────────────────────

  async getRevenueByProduct(period?: PeriodValue, limit = 10) {
    const { start, end } = getDateRangeFromPeriod(period)

    return OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.price', '$items.buy_count'] } },
          units_sold: { $sum: '$items.buy_count' },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product_info',
        },
      },
      { $unwind: { path: '$product_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: { $ifNull: ['$product_info.name', 'Sản phẩm đã xóa'] },
          image: { $ifNull: ['$product_info.image', ''] },
          revenue: 1,
          units_sold: 1,
          order_count: 1,
        },
      },
    ])
  }

  // ─── 1.7 getOrderTrend ─────────────────────────────────────────

  async getOrderTrend(period?: PeriodValue) {
    const { start, end } = getDateRangeFromPeriod(period)
    const { format } = getGroupingForPeriod(period)

    return OrderModel.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          order_count: { $sum: 1 },
          total_value: { $sum: '$total' },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.DELIVERED] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', order_count: 1, total_value: 1, delivered: 1, cancelled: 1 } },
    ])
  }

  // ─── 1.8 getUserGrowth ─────────────────────────────────────────

  async getUserGrowth(period?: PeriodValue) {
    const { start, end } = getDateRangeFromPeriod(period)
    const { format } = getGroupingForPeriod(period)

    return UserModel.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          new_users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', new_users: 1 } },
    ])
  }

  // ─── 1.9 getTopBuyers ─────────────────────────────────────────

  async getTopBuyers(period?: PeriodValue, limit = 10) {
    const { start, end } = getDateRangeFromPeriod(period)

    return OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$user',
          total_spent: { $sum: '$total' },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { total_spent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          user_id: '$_id',
          name: { $ifNull: ['$user_info.name', 'Người dùng đã xóa'] },
          email: { $ifNull: ['$user_info.email', ''] },
          avatar: { $ifNull: ['$user_info.avatar', ''] },
          total_spent: 1,
          order_count: 1,
        },
      },
    ])
  }

  // ─── Product Analytics ──────────────────────────────────────────

  async getTopSelling(period?: PeriodValue, limit = 10) {
    const { start, end } = getDateRangeFromPeriod(period)

    return OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, delivered_at: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          units_sold: { $sum: '$items.buy_count' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.buy_count'] } },
        },
      },
      { $sort: { units_sold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product_info',
        },
      },
      { $unwind: { path: '$product_info', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product_info.category',
          foreignField: '_id',
          as: 'category_info',
        },
      },
      { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: { $ifNull: ['$product_info.name', 'Sản phẩm đã xóa'] },
          image: { $ifNull: ['$product_info.image', ''] },
          units_sold: 1,
          revenue: 1,
          category_name: { $ifNull: ['$category_info.name', 'Không phân loại'] },
        },
      },
    ])
  }

  async getTopViewed(limit = 10) {
    return ProductModel.aggregate([
      { $match: { view: { $gt: 0 } } },
      { $sort: { view: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category_info',
        },
      },
      { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: 1,
          image: 1,
          view: 1,
          sold: 1,
          conversion_rate: {
            $cond: [{ $gt: ['$view', 0] }, { $round: [{ $divide: ['$sold', '$view'] }, 4] }, 0],
          },
        },
      },
    ])
  }

  async getTopRated(limit = 10, minReviews = 1) {
    return ReviewModel.aggregate([
      { $group: { _id: '$product', review_count: { $sum: 1 }, average_rating: { $avg: '$rating' } } },
      { $match: { review_count: { $gte: minReviews } } },
      { $sort: { average_rating: -1, review_count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product_info',
        },
      },
      { $unwind: { path: '$product_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          product_id: '$_id',
          name: { $ifNull: ['$product_info.name', 'Sản phẩm đã xóa'] },
          image: { $ifNull: ['$product_info.image', ''] },
          average_rating: { $round: ['$average_rating', 1] },
          review_count: 1,
        },
      },
    ])
  }

  async getStatsByCategory() {
    return ProductModel.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category_info',
        },
      },
      { $unwind: { path: '$category_info', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category',
          category_name: { $first: { $ifNull: ['$category_info.name', 'Không phân loại'] } },
          product_count: { $sum: 1 },
          total_stock: { $sum: '$quantity' },
          total_sold: { $sum: '$sold' },
          average_price: { $avg: '$price' },
          average_rating: { $avg: '$rating' },
        },
      },
      { $sort: { product_count: -1 } },
      {
        $project: {
          _id: 0,
          category_id: '$_id',
          category_name: 1,
          product_count: 1,
          total_stock: 1,
          total_sold: 1,
          average_price: { $round: ['$average_price', 0] },
          average_rating: { $round: ['$average_rating', 1] },
        },
      },
    ])
  }
}

