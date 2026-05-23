/**
 * CleanupWorker — processes jobs from the `cleanup` queue.
 *
 * Dispatches to sub-handlers based on payload.type.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { CLEANUP_QUEUE } from '../queues/queue.config'
import { CleanupJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'

export class CleanupWorker {
  readonly worker: Worker

  constructor() {
    this.worker = new Worker<CleanupJobPayload>(
      CLEANUP_QUEUE,
      async (job: Job<CleanupJobPayload>) => {
        Logger.apiInfo('[CleanupWorker] Processing cleanup job', {
          jobId: job.id,
          type: job.data.type,
        })

        switch (job.data.type) {
          case 'expired-carts':
            await this.handleExpiredCarts(job.data)
            break
          case 'expired-sessions':
            await this.handleExpiredSessions(job.data)
            break
          case 'old-notifications':
            await this.handleOldNotifications(job.data)
            break
          default:
            Logger.apiWarn('[CleanupWorker] Unknown cleanup type', { type: (job.data as any).type })
        }
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[CleanupWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[CleanupWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  private async handleExpiredCarts(payload: CleanupJobPayload): Promise<void> {
    Logger.apiInfo('[CleanupWorker] Handling expired-carts cleanup', {
      cutoffDate: payload.cutoffDate,
    })
    // TODO: implement expired cart cleanup logic
  }

  private async handleExpiredSessions(payload: CleanupJobPayload): Promise<void> {
    Logger.apiInfo('[CleanupWorker] Handling expired-sessions cleanup', {
      cutoffDate: payload.cutoffDate,
    })
    // TODO: implement expired session cleanup logic
  }

  private async handleOldNotifications(payload: CleanupJobPayload): Promise<void> {
    Logger.apiInfo('[CleanupWorker] Handling old-notifications cleanup', {
      cutoffDate: payload.cutoffDate,
    })
    // TODO: implement old notification cleanup logic
  }
}
