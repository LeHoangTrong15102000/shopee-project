/**
 * EmailWorker — processes jobs from the `email` queue.
 *
 * The actual email send is stubbed with a Logger call.
 * TODO: integrate an email provider (SendGrid, SES, Resend, etc.) in a future phase.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { EMAIL_QUEUE } from '../queues/queue.config'
import { EmailJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'

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
        // TODO: integrate email provider (SendGrid / SES / Resend)
        Logger.apiInfo('[EmailWorker] Email stub — would send email', {
          to: job.data.to,
          subject: job.data.subject,
        })
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
