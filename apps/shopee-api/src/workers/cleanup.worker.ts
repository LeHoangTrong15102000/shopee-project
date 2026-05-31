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
import { PurchaseModel } from '@database/models/purchase.model'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { NotificationModel } from '@database/models/notification.model'
import { STATUS_PURCHASE } from '@constants/purchase'

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

  private async handleExpiredCarts(_payload: CleanupJobPayload): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    Logger.apiInfo('[CleanupWorker] Handling expired-carts cleanup', { cutoff })

    const result = await PurchaseModel.deleteMany({
      status: STATUS_PURCHASE.IN_CART,
      updatedAt: { $lt: cutoff },
    })

    Logger.apiInfo('[CleanupWorker] Expired carts deleted', { deletedCount: result.deletedCount })
  }

  private async handleExpiredSessions(_payload: CleanupJobPayload): Promise<void> {
    const now = new Date()
    Logger.apiInfo('[CleanupWorker] Handling expired-sessions cleanup', { now })

    const result = await RefreshTokenModel.deleteMany({
      $or: [{ expiresAt: { $lt: now } }, { revokedAt: { $ne: null } }],
    })

    Logger.apiInfo('[CleanupWorker] Expired sessions deleted', { deletedCount: result.deletedCount })
  }

  private async handleOldNotifications(_payload: CleanupJobPayload): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    Logger.apiInfo('[CleanupWorker] Handling old-notifications cleanup', { cutoff })

    const result = await NotificationModel.deleteMany({
      is_read: true,
      createdAt: { $lt: cutoff },
    })

    Logger.apiInfo('[CleanupWorker] Old notifications deleted', { deletedCount: result.deletedCount })
  }
}
