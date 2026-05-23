/**
 * SearchSyncWorker — processes jobs from the `search-sync` queue.
 *
 * Stub implementation — actual Meilisearch integration is Phase 3.
 * TODO: integrate Meilisearch (Phase 3)
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { SEARCH_SYNC_QUEUE } from '../queues/queue.config'
import { SearchSyncJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'

export class SearchSyncWorker {
  readonly worker: Worker

  constructor() {
    this.worker = new Worker<SearchSyncJobPayload>(
      SEARCH_SYNC_QUEUE,
      async (job: Job<SearchSyncJobPayload>) => {
        Logger.apiInfo('[SearchSyncWorker] Processing search-sync job', {
          jobId: job.id,
          entityType: job.data.entityType,
          entityId: job.data.entityId,
          operation: job.data.operation,
        })
        // TODO: integrate Meilisearch (Phase 3)
        Logger.apiInfo('[SearchSyncWorker] Search sync stub — would sync to Meilisearch', {
          entityType: job.data.entityType,
          entityId: job.data.entityId,
          operation: job.data.operation,
        })
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[SearchSyncWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[SearchSyncWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }
}
