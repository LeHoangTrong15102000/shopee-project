/**
 * ProductEventListener — handles product domain events and enqueues search-sync jobs.
 */
import { Queue } from 'bullmq'
import { OnEvent } from '../on-event.decorator'
import { DomainEvent } from '../domain-events'
import { SearchSyncJobPayload } from '../../queues/job-payloads'
import { Logger } from '@utils/logger'

export class ProductEventListener {
  constructor(private readonly searchSyncQueue: Queue<SearchSyncJobPayload>) {}

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
    const { productId, name } = event.payload

    Logger.apiInfo('[ProductEventListener] product.updated — enqueuing search-sync', {
      productId,
      name,
    })

    await this.searchSyncQueue.add('product-reindex', {
      entityType: 'product',
      entityId: productId,
      operation: 'index',
    })
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
}
