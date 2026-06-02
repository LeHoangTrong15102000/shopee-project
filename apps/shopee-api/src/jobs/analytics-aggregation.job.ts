/**
 * AnalyticsAggregationJob — registers a BullMQ repeatable job for daily analytics aggregation.
 *
 * Runs daily at 01:00 UTC. Computes previous day's totalOrders, totalRevenue,
 * topProductIds (top 10 by order count), newUsers; upserts daily_stats and job_stats documents.
 */
import { Logger } from '@utils/logger'
import { analyticsAggregationQueue } from '../queues'

export class AnalyticsAggregationJob {
  /**
   * Register the BullMQ repeatable job.
   * Runs daily at 01:00 UTC using a cron expression.
   */
  async start(): Promise<void> {
    Logger.apiInfo(
      '[AnalyticsAggregationJob] Registering BullMQ repeatable job (daily at 01:00 UTC)',
    )

    await analyticsAggregationQueue.add(
      'analytics-aggregation',
      { triggeredAt: new Date().toISOString() },
      {
        repeat: { pattern: '0 1 * * *' },
        jobId: 'analytics-aggregation-repeatable',
      },
    )

    Logger.apiInfo('[AnalyticsAggregationJob] Repeatable job registered')
  }
}
