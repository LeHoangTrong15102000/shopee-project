/**
 * FeedWorker — processes fan-out jobs from the `feed.fan-out` queue.
 *
 * For each job, writes FeedItem documents for each recipient (follower).
 * Uses ordered bulk insert with ordered:false so a duplicate-key error on
 * one recipient does not abort the rest.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { FEED_FAN_OUT_QUEUE } from '../queues/queue.config'
import { FeedFanOutJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { FeedItemModel } from '@database/models/feed-item.model'
import mongoose from 'mongoose'

export class FeedWorker {
  readonly worker: Worker

  constructor() {
    this.worker = new Worker<FeedFanOutJobPayload>(
      FEED_FAN_OUT_QUEUE,
      async (job: Job<FeedFanOutJobPayload>) => {
        const {
          actorId,
          actorName,
          actorAvatar,
          actionType,
          targetType,
          targetId,
          targetSnapshot,
          recipientIds,
        } = job.data

        if (!recipientIds || recipientIds.length === 0) {
          Logger.apiInfo('[FeedWorker] No recipients — skipping', { jobId: job.id })
          return
        }

        Logger.apiInfo('[FeedWorker] Processing feed fan-out job', {
          jobId: job.id,
          actionType,
          targetId,
          recipientCount: recipientIds.length,
        })

        const docs = recipientIds.map((userId) => ({
          userId: new mongoose.Types.ObjectId(userId),
          actorId: new mongoose.Types.ObjectId(actorId),
          actorName,
          actorAvatar,
          actionType,
          targetType,
          targetId: new mongoose.Types.ObjectId(targetId),
          targetSnapshot,
          isRead: false,
        }))

        try {
          // ordered:false — continue inserting even if some docs fail (e.g. duplicates)
          await FeedItemModel.insertMany(docs, { ordered: false })

          Logger.apiInfo('[FeedWorker] Feed items inserted', {
            jobId: job.id,
            count: docs.length,
          })
        } catch (err: unknown) {
          // BulkWriteError with code 11000 means some duplicates were skipped — not fatal
          const bulkErr = err as { code?: number; insertedDocs?: unknown[] }
          if (bulkErr?.code === 11000) {
            Logger.apiInfo('[FeedWorker] Some feed items already existed (duplicate key) — skipped', {
              jobId: job.id,
            })
          } else {
            throw err
          }
        }
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[FeedWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[FeedWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }
}
