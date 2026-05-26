/**
 * ProductEventListener — handles product domain events and enqueues search-sync jobs.
 * Also sends price-drop FCM notifications to users who have the product wishlisted.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { SearchSyncJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'
import { WishlistModel } from '@database/models/wishlist.model'
import mongoose from 'mongoose'
import type { FcmService } from '../../services/fcm.service'

export class ProductEventListener {
  constructor(
    private readonly searchSyncQueue: Queue<SearchSyncJobPayload>,
    private readonly fcmService?: FcmService,
  ) {}

  @OnEvent('product.created')
  async onProductCreated(
    event: Extract<DomainEvent, { type: 'product.created' }>,
  ): Promise<void> {
    const { productId, name } = event.payload

    Logger.apiInfo('[ProductEventListener] product.created — enqueuing search-sync', {
      productId,
      name,
    })

    await this.searchSyncQueue.add('product-index', {
      entityType: 'product',
      entityId: productId,
      operation: 'index',
    })
  }

  @OnEvent('product.updated')
  async onProductUpdated(
    event: Extract<DomainEvent, { type: 'product.updated' }>,
  ): Promise<void> {
    const { productId, name, oldPrice, newPrice } = event.payload

    Logger.apiInfo('[ProductEventListener] product.updated — enqueuing search-sync', {
      productId,
      name,
    })

    await this.searchSyncQueue.add('product-reindex', {
      entityType: 'product',
      entityId: productId,
      operation: 'index',
    })

    // Send price-drop FCM notifications to users who wishlisted this product
    if (
      this.fcmService &&
      oldPrice !== undefined &&
      newPrice !== undefined &&
      newPrice < oldPrice
    ) {
      await this.sendPriceDropNotifications(productId, name, oldPrice, newPrice)
    }
  }

  @OnEvent('product.deleted')
  async onProductDeleted(
    event: Extract<DomainEvent, { type: 'product.deleted' }>,
  ): Promise<void> {
    const { productId } = event.payload

    Logger.apiInfo('[ProductEventListener] product.deleted — enqueuing search-sync delete', {
      productId,
    })

    await this.searchSyncQueue.add('product-delete', {
      entityType: 'product',
      entityId: productId,
      operation: 'delete',
    })
  }

  /**
   * Query all users who have the product in their wishlist and send FCM price-drop notifications.
   * Skips users without a registered device token silently.
   */
  private async sendPriceDropNotifications(
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
  ): Promise<void> {
    try {
      const wishlistItems = await WishlistModel.find({
        product: new mongoose.Types.ObjectId(productId),
      })
        .select('user')
        .lean()

      if (wishlistItems.length === 0) return

      Logger.apiInfo('[ProductEventListener] Sending price-drop FCM notifications', {
        productId,
        oldPrice,
        newPrice,
        recipientCount: wishlistItems.length,
      })

      const title = 'Price Drop Alert!'
      const body = `${productName} is now cheaper — was ${oldPrice.toLocaleString()}, now ${newPrice.toLocaleString()}`
      const data = { productId, oldPrice: String(oldPrice), newPrice: String(newPrice), type: 'price_drop' }

      await Promise.allSettled(
        wishlistItems.map((item) =>
          this.fcmService!.sendToUser(item.user.toString(), title, body, data),
        ),
      )
    } catch (err: unknown) {
      const error = err as Error
      Logger.apiError('[ProductEventListener] Failed to send price-drop notifications', {
        productId,
        error: error?.message,
      })
    }
  }
}
