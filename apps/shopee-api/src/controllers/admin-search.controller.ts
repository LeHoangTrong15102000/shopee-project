/**
 * AdminSearchController — admin endpoints for search management.
 *
 * POST /admin/search/reindex — enqueue a full reindex job, returns 202 Accepted
 */
import { Request, Response } from 'express'
import { searchSyncQueue } from '../queues'
import { Logger } from '@utils/logger'

/**
 * POST /admin/search/reindex
 *
 * Enqueues a BullMQ job to reindex all products into Meilisearch.
 * Returns 202 Accepted immediately — the job runs asynchronously.
 */
const triggerReindex = async (_req: Request, res: Response): Promise<void> => {
  const job = await searchSyncQueue.add(
    'reindex-all',
    {
      entityType: 'product',
      entityId: 'all',
      operation: 'index',
    },
    {
      attempts: 1, // Reindex is idempotent — no retry needed
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  )

  Logger.apiInfo('[AdminSearchController] Reindex job enqueued', { jobId: job.id })

  res.status(202).json({
    message: 'Reindex job enqueued',
    data: { jobId: job.id },
  })
}

export const adminSearchController = {
  triggerReindex,
}
