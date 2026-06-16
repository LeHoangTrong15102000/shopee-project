/**
 * EmailWorker — processes jobs from the `email` queue.
 *
 * Sends email via the Resend mailer module.  BullMQ retry / error / failed
 * handlers are preserved so any future email types work automatically just by
 * enqueueing a job with the correct template + data.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { EMAIL_QUEUE } from '../queues/queue.config'
import { EmailJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { sendEmail } from '../services/email/resend.client'

export class EmailWorker {
  readonly worker: Worker

  constructor() {
    this.worker = new Worker<EmailJobPayload>(
      EMAIL_QUEUE,
      async (job: Job<EmailJobPayload>) => {
        Logger.apiInfo('[EmailWorker] Processing email job', {
          jobId: job.id,
          to: job.data.to,
          subject: job.data.subject,
        })
        await sendEmail(job.data)
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[EmailWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[EmailWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }
}
