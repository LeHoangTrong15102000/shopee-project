/**
 * CleanupJob — registers BullMQ repeatable jobs for periodic data cleanup.
 *
 * Schedules three cleanup tasks on the `cleanup` queue:
 * - expired-carts: every 6 hours
 * - expired-sessions: daily at 03:00 UTC
 * - old-notifications: weekly on Sunday at 04:00 UTC
 *
 * Each job uses a stable jobId so multi-instance deployments dedupe correctly.
 */
import { Logger } from '@utils/logger'
import { cleanupQueue } from '../queues'

export class CleanupJob {
  /**
   * Register all three BullMQ repeatable cleanup jobs.
   */
  async start(): Promise<void> {
    Logger.apiInfo('[CleanupJob] Registering BullMQ repeatable cleanup jobs')

    // expired-carts: every 6 hours
    await cleanupQueue.add(
      'cleanup',
      { type: 'expired-carts' },
      {
        repeat: { every: 6 * 60 * 60 * 1000 },
        jobId: 'cleanup-expired-carts-repeatable',
      },
    )

    // expired-sessions: daily at 03:00 UTC
    await cleanupQueue.add(
      'cleanup',
      { type: 'expired-sessions' },
      {
        repeat: { pattern: '0 3 * * *' },
        jobId: 'cleanup-expired-sessions-repeatable',
      },
    )

    // old-notifications: weekly on Sunday at 04:00 UTC
    await cleanupQueue.add(
      'cleanup',
      { type: 'old-notifications' },
      {
        repeat: { pattern: '0 4 * * 0' },
        jobId: 'cleanup-old-notifications-repeatable',
      },
    )

    Logger.apiInfo('[CleanupJob] All cleanup repeatable jobs registered')
  }
}
