/**
 * FeedEventListener — listens to social domain events and enqueues feed.fan-out jobs.
 *
 * For product.liked, product.shared, product.reviewed, and order.created events,
 * this listener determines the recipient list and enqueues a fan-out job so the
 * FeedWorker can write FeedItem documents for each recipient.
 *
 * Recipient strategy (simple approach — fan-out to the actor's followers):
 * Since there is no follower graph in this codebase, we fan-out to users who
 * have the target product in their wishlist (for product events) or to the
 * ordering user's own feed (for order events). This can be extended later.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { FeedFanOutJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'
import { WishlistModel } from '@database/models/wishlist.model'

export class FeedEventListener {
  constructor(private readonly feedFanOutQueue: Queue<FeedFanOutJobPayload>) {}

  @OnEvent('product.liked')
  async onProductLiked(
    event: Extract<DomainEvent, { type: 'product.liked' }>,
  ): Promise<void> {
    const { productId, productName, productImage, productPrice, userId, userName, userAvatar } =
      event.payload

    Logger.apiInfo('[FeedEventListener] product.liked — enqueuing feed fan-out', {
      productId,
      userId,
    })

    // Fan-out to users who have this product wishlisted (they care about it)
    const wishlistEntries = await WishlistModel.find(
      { product: productId },
      { user: 1 },
    ).lean()

    const recipientIds = wishlistEntries
      .map((w) => w.user.toString())
      .filter((id) => id !== userId) // exclude the actor

    if (recipientIds.length === 0) return

    await this.feedFanOutQueue.add('feed-liked', {
      actorId: userId,
      actorName: userName,
      actorAvatar: userAvatar,
      actionType: 'product.liked',
      targetType: 'product',
      targetId: productId,
      targetSnapshot: {
        name: productName,
        image: productImage,
        price: productPrice,
      },
      recipientIds,
    })
  }

  @OnEvent('product.shared')
  async onProductShared(
    event: Extract<DomainEvent, { type: 'product.shared' }>,
  ): Promise<void> {
    const { productId, productName, productImage, productPrice, userId, userName, userAvatar, shareUrl } =
      event.payload

    Logger.apiInfo('[FeedEventListener] product.shared — enqueuing feed fan-out', {
      productId,
      userId,
    })

    const wishlistEntries = await WishlistModel.find(
      { product: productId },
      { user: 1 },
    ).lean()

    const recipientIds = wishlistEntries
      .map((w) => w.user.toString())
      .filter((id) => id !== userId)

    if (recipientIds.length === 0) return

    await this.feedFanOutQueue.add('feed-shared', {
      actorId: userId,
      actorName: userName,
      actorAvatar: userAvatar,
      actionType: 'product.shared',
      targetType: 'product',
      targetId: productId,
      targetSnapshot: {
        name: productName,
        image: productImage,
        price: productPrice,
        shareUrl,
      },
      recipientIds,
    })
  }

  @OnEvent('product.reviewed')
  async onProductReviewed(
    event: Extract<DomainEvent, { type: 'product.reviewed' }>,
  ): Promise<void> {
    const { productId, productName, productImage, userId, userName, userAvatar, rating, reviewId } =
      event.payload

    Logger.apiInfo('[FeedEventListener] product.reviewed — enqueuing feed fan-out', {
      productId,
      userId,
    })

    const wishlistEntries = await WishlistModel.find(
      { product: productId },
      { user: 1 },
    ).lean()

    const recipientIds = wishlistEntries
      .map((w) => w.user.toString())
      .filter((id) => id !== userId)

    if (recipientIds.length === 0) return

    await this.feedFanOutQueue.add('feed-reviewed', {
      actorId: userId,
      actorName: userName,
      actorAvatar: userAvatar,
      actionType: 'product.reviewed',
      targetType: 'product',
      targetId: productId,
      targetSnapshot: {
        name: productName,
        image: productImage,
        rating,
        reviewId,
      },
      recipientIds,
    })
  }

  @OnEvent('order.created')
  async onOrderCreated(
    event: Extract<DomainEvent, { type: 'order.created' }>,
  ): Promise<void> {
    const { orderId, userId } = event.payload

    Logger.apiInfo('[FeedEventListener] order.created — enqueuing feed fan-out (self)', {
      orderId,
      userId,
    })

    // For order events, fan-out only to the user's own feed
    await this.feedFanOutQueue.add('feed-order-created', {
      actorId: userId,
      actorName: '',
      actionType: 'order.created',
      targetType: 'order',
      targetId: orderId,
      targetSnapshot: { orderId },
      recipientIds: [userId],
    })
  }
}
