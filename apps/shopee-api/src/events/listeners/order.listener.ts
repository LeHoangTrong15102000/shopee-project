/**
 * OrderEventListener — handles order domain events and enqueues BullMQ jobs.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { EmailJobPayload, NotificationJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'
import type { RecommendationService } from '../../services/recommendation.service'

export class OrderEventListener {
  constructor(
    private readonly emailQueue: Queue<EmailJobPayload>,
    private readonly notificationQueue: Queue<NotificationJobPayload>,
    private readonly recommendationService?: RecommendationService,
  ) {}

  @OnEvent('order.created')
  async onOrderCreated(event: Extract<DomainEvent, { type: 'order.created' }>): Promise<void> {
    const { orderId, userId, totalAmount, items } = event.payload

    Logger.apiInfo('[OrderEventListener] order.created — enqueuing email + notification', {
      orderId,
      userId,
    })

    // Enqueue confirmation email
    await this.emailQueue.add('order-confirmation', {
      to: userId, // Will be resolved to email by the worker
      subject: 'Order Confirmation',
      body: `Your order #${orderId} has been placed successfully. Total: ${totalAmount}`,
      template: 'order-confirmation',
      data: { orderId, totalAmount },
    })

    // Enqueue in-app notification
    await this.notificationQueue.add('order-created-notification', {
      userId,
      title: 'Order Placed Successfully',
      content: `Your order #${orderId} has been placed. Total: ${totalAmount}`,
      type: 'order',
      link: `/orders/${orderId}`,
    })

    // Invalidate bought-together cache for all products in this order
    if (this.recommendationService && items && items.length > 0) {
      const productIds = items.map((item) => item.productId)
      await this.recommendationService.invalidateBoughtTogetherCache(productIds)
    }
  }

  @OnEvent('order.status_changed')
  async onOrderStatusChanged(
    event: Extract<DomainEvent, { type: 'order.status_changed' }>,
  ): Promise<void> {
    const { orderId, userId, newStatus } = event.payload

    Logger.apiInfo('[OrderEventListener] order.status_changed — enqueuing notification', {
      orderId,
      userId,
      newStatus,
    })

    await this.notificationQueue.add('order-status-notification', {
      userId,
      title: 'Order Status Updated',
      content: `Your order #${orderId} status has changed to: ${newStatus}`,
      type: 'order',
      link: `/orders/${orderId}`,
    })
  }

  @OnEvent('order.cancelled')
  async onOrderCancelled(event: Extract<DomainEvent, { type: 'order.cancelled' }>): Promise<void> {
    const { orderId, userId, reason } = event.payload

    Logger.apiInfo('[OrderEventListener] order.cancelled — enqueuing notification', {
      orderId,
      userId,
    })

    await this.notificationQueue.add('order-cancelled-notification', {
      userId,
      title: 'Order Cancelled',
      content: reason
        ? `Your order #${orderId} has been cancelled. Reason: ${reason}`
        : `Your order #${orderId} has been cancelled.`,
      type: 'order',
      link: `/orders/${orderId}`,
    })
  }
}
