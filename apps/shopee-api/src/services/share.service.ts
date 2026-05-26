/**
 * ShareService — handles product share operations.
 *
 * Atomically increments shareCount on the product document and emits
 * the product.shared domain event so the feed fan-out can propagate it.
 */
import mongoose from 'mongoose'
import { ProductModel } from '@database/models/product.model'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import type { EventBus } from '../events/event-bus'
import { Logger } from '@utils/logger'

export interface ShareProductResult {
  shareUrl: string
  shareCount: number
}

export class ShareService extends BaseService {
  eventBus?: EventBus

  private getShareUrl(productId: string): string {
    const domain = process.env.APP_DOMAIN || 'https://shopee.example.com'
    return `${domain}/products/${productId}?ref=share`
  }

  /**
   * Increment shareCount atomically and emit product.shared event.
   * Returns the share URL and updated shareCount.
   */
  async shareProduct(
    productId: string,
    userId: string,
    userName: string,
    userAvatar?: string,
  ): Promise<ShareProductResult> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const product = await ProductModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(productId),
      { $inc: { shareCount: 1 } },
      { new: true, select: 'name image price shareCount' },
    ).lean()

    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    const shareUrl = this.getShareUrl(productId)

    Logger.apiInfo('[ShareService] Product shared', {
      productId,
      userId,
      shareCount: product.shareCount,
    })

    // Emit domain event for feed fan-out
    if (this.eventBus) {
      this.eventBus.emit({
        type: 'product.shared',
        payload: {
          productId,
          productName: product.name as string,
          productImage: product.image as string | undefined,
          productPrice: product.price as number | undefined,
          userId,
          userName,
          userAvatar,
          shareUrl,
        },
      })
    }

    return {
      shareUrl,
      shareCount: product.shareCount as number,
    }
  }
}
