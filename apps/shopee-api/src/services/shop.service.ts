import mongoose from 'mongoose'
import { ShopModel, IShop } from '@database/models/shop.model'
import { ProductModel } from '@database/models/product.model'
import { BaseService, NotFoundError, ValidationError } from './base.service'

export class ShopService extends BaseService {
  async getShop(shopId: string, userId?: string): Promise<IShop & { isFollowing: boolean }> {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }
    const shop = await ShopModel.findById(shopId).lean()
    if (!shop) throw new NotFoundError('Shop', shopId)

    // Suspended or banned shops are hidden from user-facing API
    if (shop.status === 'suspended' || shop.status === 'banned') {
      throw new NotFoundError('Shop', shopId)
    }

    const isFollowing = userId
      ? shop.followers.some((f) => f.toString() === userId)
      : false

    const { followers, ...rest } = shop
    return { ...rest, followers, isFollowing }
  }

  async getShopProducts(
    shopId: string,
    page = 1,
    limit = 20,
    sort = 'createdAt',
  ) {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }
    const skip = (page - 1) * limit
    const sortOrder: Record<string, 1 | -1> = { [sort]: -1 }

    const [data, total] = await Promise.all([
      ProductModel.find({ shop_id: new mongoose.Types.ObjectId(shopId) })
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments({ shop_id: new mongoose.Types.ObjectId(shopId) }),
    ])

    return { data, total, page, limit }
  }

  async followShop(shopId: string, userId: string): Promise<void> {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }
    const shop = await ShopModel.findById(shopId)
    if (!shop) throw new NotFoundError('Shop', shopId)

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const alreadyFollowing = shop.followers.some((f) => f.toString() === userId)
    if (!alreadyFollowing) {
      await ShopModel.findByIdAndUpdate(shopId, {
        $addToSet: { followers: userObjectId },
        $inc: { followerCount: 1 },
      })
    }
  }

  async unfollowShop(shopId: string, userId: string): Promise<void> {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }
    const shop = await ShopModel.findById(shopId)
    if (!shop) throw new NotFoundError('Shop', shopId)

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const wasFollowing = shop.followers.some((f) => f.toString() === userId)
    if (wasFollowing) {
      await ShopModel.findByIdAndUpdate(shopId, {
        $pull: { followers: userObjectId },
        $inc: { followerCount: -1 },
      })
    }
  }
}
