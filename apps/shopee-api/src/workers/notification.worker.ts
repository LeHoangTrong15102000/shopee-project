/**
 * NotificationWorker — processes jobs from the `notification` queue.
 *
 * Persists the notification via NotificationService, then sends an FCM push
 * notification via FcmService.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { NOTIFICATION_QUEUE } from '../queues/queue.config'
import { NotificationJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { NotificationService } from '@services/notification.service'
import { FcmService } from '@services/fcm.service'

export class NotificationWorker {
  readonly worker: Worker

  constructor(
    private readonly notificationService: NotificationService,
    private readonly fcmService: FcmService,
  ) {
    this.worker = new Worker<NotificationJobPayload>(
      NOTIFICATION_QUEUE,
      async (job: Job<NotificationJobPayload>) => {
        const { userId, title, content, type, link } = job.data

        Logger.apiInfo('[NotificationWorker] Processing notification job', {
          jobId: job.id,
          userId,
          type,
        })

        if (userId === 'broadcast') {
          // Broadcast jobs (e.g. flash sale events) have no individual user — send
          // directly to the FCM topic instead of persisting a per-user notification.
          await this.fcmService.sendToTopic('flash_sale', title, content, {
            type,
            link: link ?? '',
          })
          return
        }

        // Persist notification to DB
        await this.notificationService.createNotification(userId, title, content, type, link)

        // Send FCM push notification
        await this.fcmService.sendToUser(userId, title, content, { type, link: link ?? '' })
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[NotificationWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[NotificationWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }
}
