import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { WishlistModel, IWishlist } from '@database/models/wishlist.model'
import {
  IWishlistRepository,
  IWishlistItem,
  CreateWishlistDTO,
} from './interfaces/wishlist.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class WishlistRepository implements IWishlistRepository {
  async findById(id: string | Types.ObjectId): Promise<IWishlistItem | null> {
    return WishlistModel.findById(id)
      .populate({
        path: 'product',
        select: 'name price price_before_discount image rating sold category',
        populate: { path: 'category', select: 'name' },
      })
      .lean<IWishlistItem | null>()
  }

  async findOne(filter: FilterQuery<IWishlist>): Promise<IWishlistItem | null> {
    return WishlistModel.findOne(filter).lean<IWishlistItem | null>()
  }

  async find(filter: FilterQuery<IWishlist>, options?: QueryOptions): Promise<IWishlistItem[]> {
    return WishlistModel.find(filter, null, options).lean<IWishlistItem[]>()
  }

  async findPaginated(
    filter: FilterQuery<IWishlist>,
    options: PaginationOptions
  ): Promise<PaginatedResult<IWishlistItem>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      WishlistModel.find(filter)
        .populate({
          path: 'product',
          select: 'name price price_before_discount image rating sold category',
          populate: { path: 'category', select: 'name' },
        })
        .sort(sort || { addedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IWishlistItem[]>(),
      WishlistModel.countDocuments(filter),
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

  async create(data: CreateWishlistDTO): Promise<IWishlistItem> {
    const item = new WishlistModel(data)
    const saved = await item.save()
    return saved.toObject() as IWishlistItem
  }

  async updateById(id: string | Types.ObjectId, data: Partial<IWishlistItem>): Promise<IWishlistItem | null> {
    return WishlistModel.findByIdAndUpdate(id, data, { new: true }).lean<IWishlistItem | null>()
  }

  async updateMany(filter: FilterQuery<IWishlist>, data: UpdateQuery<IWishlist>): Promise<number> {
    const result = await WishlistModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IWishlistItem | null> {
    return WishlistModel.findByIdAndDelete(id).lean<IWishlistItem | null>()
  }

  async deleteMany(filter: FilterQuery<IWishlist>): Promise<number> {
    const result = await WishlistModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IWishlist>): Promise<number> {
    return WishlistModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IWishlist>): Promise<boolean> {
    const doc = await WishlistModel.exists(filter)
    return doc !== null
  }

  async findByUser(userId: string | Types.ObjectId, pagination: PaginationOptions): Promise<PaginatedResult<IWishlistItem>> {
    return this.findPaginated({ user: new Types.ObjectId(userId.toString()) }, pagination)
  }

  async isInWishlist(userId: string | Types.ObjectId, productId: string | Types.ObjectId): Promise<boolean> {
    return this.exists({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
    })
  }

  async addToWishlist(userId: string | Types.ObjectId, productId: string | Types.ObjectId): Promise<IWishlistItem> {
    const existing = await WishlistModel.findOne({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
    }).lean<IWishlistItem | null>()

    if (existing) {
      return existing
    }

    return this.create({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
    })
  }

  async removeFromWishlist(userId: string | Types.ObjectId, productId: string | Types.ObjectId): Promise<IWishlistItem | null> {
    return WishlistModel.findOneAndDelete({
      user: new Types.ObjectId(userId.toString()),
      product: new Types.ObjectId(productId.toString()),
    }).lean<IWishlistItem | null>()
  }

  async clearUserWishlist(userId: string | Types.ObjectId): Promise<number> {
    return this.deleteMany({ user: new Types.ObjectId(userId.toString()) })
  }

  async getUserWishlistCount(userId: string | Types.ObjectId): Promise<number> {
    return this.count({ user: new Types.ObjectId(userId.toString()) })
  }

  async checkProducts(userId: string | Types.ObjectId, productIds: (string | Types.ObjectId)[]): Promise<Map<string, boolean>> {
    const userObjectId = new Types.ObjectId(userId.toString())
    const productObjectIds = productIds.map(id => new Types.ObjectId(id.toString()))

    const items = await WishlistModel.find({
      user: userObjectId,
      product: { $in: productObjectIds },
    }).lean<IWishlistItem[]>()

    const inWishlist = new Set(items.map(item => item.product.toString()))
    const result = new Map<string, boolean>()

    productIds.forEach(id => {
      result.set(id.toString(), inWishlist.has(id.toString()))
    })

    return result
  }
}

