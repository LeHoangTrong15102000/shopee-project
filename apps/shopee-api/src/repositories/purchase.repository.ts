import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { PurchaseModel } from '@database/models/purchase.model'
import { IPurchase } from '../@types/models.type'
import { STATUS_PURCHASE } from '@constants/purchase'
import {
  IPurchaseRepository,
  PurchaseStatus,
  CreatePurchaseDTO,
  UpdatePurchaseDTO,
} from './interfaces/purchase.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

// Optimized field selections for populate
const USER_SELECT_FIELDS = '_id name email avatar'
const PRODUCT_SELECT_FIELDS = '_id name image images price price_before_discount quantity sold rating category createdAt updatedAt'

export class PurchaseRepository implements IPurchaseRepository {
  async findById(id: string | Types.ObjectId): Promise<IPurchase | null> {
    return PurchaseModel.findById(id)
      .populate({ path: 'user', select: USER_SELECT_FIELDS })
      .populate({ path: 'product', select: PRODUCT_SELECT_FIELDS })
      .lean<IPurchase | null>()
  }

  async findOne(filter: FilterQuery<IPurchase>): Promise<IPurchase | null> {
    return PurchaseModel.findOne(filter)
      .populate({ path: 'user', select: USER_SELECT_FIELDS })
      .populate({ path: 'product', select: PRODUCT_SELECT_FIELDS })
      .lean<IPurchase | null>()
  }

  async find(filter: FilterQuery<IPurchase>, options?: QueryOptions): Promise<IPurchase[]> {
    return PurchaseModel.find(filter, null, options)
      .populate({ path: 'user', select: USER_SELECT_FIELDS })
      .populate({ path: 'product', select: PRODUCT_SELECT_FIELDS })
      .lean<IPurchase[]>()
  }

  async findPaginated(
    filter: FilterQuery<IPurchase>,
    options: PaginationOptions
  ): Promise<PaginatedResult<IPurchase>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      PurchaseModel.find(filter)
        .populate({ path: 'user', select: USER_SELECT_FIELDS })
        .populate({ path: 'product', select: PRODUCT_SELECT_FIELDS })
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IPurchase[]>(),
      PurchaseModel.countDocuments(filter),
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

  async create(data: CreatePurchaseDTO): Promise<IPurchase> {
    const purchase = new PurchaseModel(data)
    const saved = await purchase.save()
    return saved.toObject() as IPurchase
  }

  async updateById(id: string | Types.ObjectId, data: UpdatePurchaseDTO): Promise<IPurchase | null> {
    return PurchaseModel.findByIdAndUpdate(id, data, { new: true })
      .populate({ path: 'user', select: USER_SELECT_FIELDS })
      .populate({ path: 'product', select: PRODUCT_SELECT_FIELDS })
      .lean<IPurchase | null>()
  }

  async updateMany(filter: FilterQuery<IPurchase>, data: UpdateQuery<IPurchase>): Promise<number> {
    const result = await PurchaseModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IPurchase | null> {
    return PurchaseModel.findByIdAndDelete(id).lean<IPurchase | null>()
  }

  async deleteMany(filter: FilterQuery<IPurchase>): Promise<number> {
    const result = await PurchaseModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IPurchase>): Promise<number> {
    return PurchaseModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IPurchase>): Promise<boolean> {
    const doc = await PurchaseModel.exists(filter)
    return doc !== null
  }

  async findByUser(
    userId: string | Types.ObjectId,
    status?: PurchaseStatus,
    pagination?: PaginationOptions
  ): Promise<IPurchase[]> {
    const filter: FilterQuery<IPurchase> = { user: new Types.ObjectId(userId.toString()) }
    if (status !== undefined && status !== PurchaseStatus.ALL) {
      filter.status = status
    }
    if (pagination) {
      const result = await this.findPaginated(filter, pagination)
      return result.data
    }
    return this.find(filter)
  }

  async findCart(userId: string | Types.ObjectId): Promise<IPurchase[]> {
    return this.find({
      user: new Types.ObjectId(userId.toString()),
      status: STATUS_PURCHASE.IN_CART,
    })
  }

  async addToCart(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    buyCount: number,
    price: number,
    priceBeforeDiscount: number,
    skuId?: string | Types.ObjectId
  ): Promise<IPurchase> {
    const existing = await this.findCartItem(userId, productId)
    if (existing) {
      const updateData: UpdatePurchaseDTO = {
        buy_count: existing.buy_count + buyCount,
      }
      if (skuId) {
        updateData.sku = skuId
        updateData.price = price
      }
      const updated = await this.updateById(existing._id!.toString(), updateData)
      return updated!
    }
    return this.create({
      user: userId.toString(),
      product: productId.toString(),
      buy_count: buyCount,
      price,
      price_before_discount: priceBeforeDiscount,
      status: PurchaseStatus.IN_CART,
      ...(skuId ? { sku: skuId } : {}),
    })
  }

  async updateCartItem(
    purchaseId: string | Types.ObjectId,
    buyCount: number,
    skuId?: string | Types.ObjectId,
    price?: number
  ): Promise<IPurchase | null> {
    const updateData: UpdatePurchaseDTO = { buy_count: buyCount }
    if (skuId) {
      updateData.sku = skuId
    }
    if (price !== undefined) {
      updateData.price = price
    }
    return this.updateById(purchaseId, updateData)
  }

  async removeFromCart(purchaseId: string | Types.ObjectId): Promise<boolean> {
    const result = await this.deleteById(purchaseId)
    return result !== null
  }

  async clearCart(userId: string | Types.ObjectId): Promise<number> {
    return this.deleteMany({
      user: new Types.ObjectId(userId.toString()),
      status: STATUS_PURCHASE.IN_CART,
    })
  }

  async updateStatus(purchaseId: string | Types.ObjectId, status: PurchaseStatus): Promise<IPurchase | null> {
    return this.updateById(purchaseId, { status })
  }

  async bulkUpdateStatus(purchaseIds: Array<string | Types.ObjectId>, status: PurchaseStatus): Promise<number> {
    const ids = purchaseIds.map((id) => new Types.ObjectId(id.toString()))
    return this.updateMany({ _id: { $in: ids } }, { status })
  }

  async findByStatus(status: PurchaseStatus, pagination: PaginationOptions): Promise<PaginatedResult<IPurchase>> {
    return this.findPaginated({ status }, pagination)
  }

  async getUserStats(userId: string | Types.ObjectId): Promise<{
    total_orders: number
    total_spent: number
    orders_by_status: Record<PurchaseStatus, number>
  }> {
    const userObjectId = new Types.ObjectId(userId.toString())
    const [totalOrders, totalSpentResult, statusCounts] = await Promise.all([
      PurchaseModel.countDocuments({
        user: userObjectId,
        status: { $ne: STATUS_PURCHASE.IN_CART },
      }),
      PurchaseModel.aggregate([
        { $match: { user: userObjectId, status: STATUS_PURCHASE.DELIVERED } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$buy_count'] } } } },
      ]),
      PurchaseModel.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    const orders_by_status = {} as Record<PurchaseStatus, number>
    for (const item of statusCounts) {
      orders_by_status[item._id as PurchaseStatus] = item.count
    }

    return {
      total_orders: totalOrders,
      total_spent: totalSpentResult[0]?.total || 0,
      orders_by_status,
    }
  }

  async findCartItem(userId: string | Types.ObjectId, productId: string | Types.ObjectId): Promise<IPurchase | null> {
    return this.findOne({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
      status: STATUS_PURCHASE.IN_CART,
    })
  }

  async findByIdAndUser(purchaseId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IPurchase | null> {
    return this.findOne({
      _id: new Types.ObjectId(purchaseId.toString()),
      user: new Types.ObjectId(userId.toString()),
    })
  }

  async deleteByUserAndProduct(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    status: PurchaseStatus
  ): Promise<number> {
    return this.deleteMany({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
      status,
    })
  }
}