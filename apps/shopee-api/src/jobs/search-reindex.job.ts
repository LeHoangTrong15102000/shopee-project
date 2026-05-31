/**
 * SearchReindexJob — registers a BullMQ repeatable job for weekly full product reindex.
 *
 * Runs every Sunday at 02:00 UTC (cron: 0 2 * * 0).
 * Enqueues a full-reindex payload onto the `search-sync` queue.
 * The SearchSyncWorker handles the actual reindex logic.
 *
 * If Meilisearch is not configured, the worker handles the failure gracefully
 * via its error/failed event handlers.
 */
import { Logger } from '@utils/logger'
import { searchSyncQueue } from '../queues'

export class SearchReindexJob {
  /**
   * Register the BullMQ repeatable job.
   * Runs weekly on Sunday at 02:00 UTC.
   */
  async start(): Promise<void> {
    Logger.apiInfo('[SearchReindexJob] Registering BullMQ repeatable job (weekly Sunday 02:00 UTC)')

    await searchSyncQueue.add(
      'search-reindex-weekly',
      { entityType: 'product', entityId: 'all', operation: 'index' },
      {
        repeat: { pattern: '0 2 * * 0' },
        jobId: 'search-reindex-weekly',
      },
    )

    Logger.apiInfo('[SearchReindexJob] Repeatable job registered')
  }
}
