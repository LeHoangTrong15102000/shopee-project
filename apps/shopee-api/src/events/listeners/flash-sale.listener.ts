/**
 * FlashSaleEventListener — handles flash sale domain events and enqueues notification jobs.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { NotificationJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'

export class FlashSaleEventListener {
  constructor(private readonly notificationQueue: Queue<NotificationJobPayload>) {}

  @OnEvent('flash_sale.started')
  async onFlashSaleStarted(
    event: Extract<DomainEvent, { type: 'flash_sale.started' }>,
  ): Promise<void> {
    const { saleId, name } = event.payload

    Logger.apiInfo('[FlashSaleEventListener] flash_sale.started — enqueuing notifications', {
      saleId,
      name,
    })

    // Enqueue a broadcast notification job for subscribed users
    // The worker will resolve the list of subscribed users
    await this.notificationQueue.add('flash-sale-started', {
      userId: 'broadcast', // Special marker — worker handles broadcast logic
      title: 'Flash Sale Started!',
      content: `Flash sale "${name}" has started! Up to 50% off — limited time offers available.`,
      type: 'flash_sale',
      link: `/flash-sales/${saleId}`,
    })
  }

  @OnEvent('flash_sale.ended')
  async onFlashSaleEnded(
    event: Extract<DomainEvent, { type: 'flash_sale.ended' }>,
  ): Promise<void> {
    const { saleId, name } = event.payload

    Logger.apiInfo('[FlashSaleEventListener] flash_sale.ended — enqueuing notifications', {
      saleId,
      name,
    })

    await this.notificationQueue.add('flash-sale-ended', {
      userId: 'broadcast',
      title: 'Flash Sale Ended',
      content: `Flash sale "${name}" has ended.`,
      type: 'flash_sale',
      link: `/flash-sales/${saleId}`,
    })
  }
}
