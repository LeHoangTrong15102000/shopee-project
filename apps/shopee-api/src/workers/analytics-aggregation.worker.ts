/**
 * AnalyticsAggregationWorker — processes jobs from the `analytics-aggregation` queue.
 *
 * Computes previous day's stats and upserts daily_stats + job_stats documents.
 */
import { Worker, Job, Queue } from 'bullmq'
import { Logger } from '@utils/logger'
import { ANALYTICS_AGGREGATION_QUEUE } from '../queues/queue.config'
import { AnalyticsAggregationJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { OrderModel, ORDER_STATUS } from '@database/models/order.model'
import { UserModel } from '@database/models/user.model'
import { DailyStatsModel } from '@database/models/daily-stats.model'
import { JobStatsRepository } from '@repositories/job-stats.repository'

export class AnalyticsAggregationWorker {
  readonly worker: Worker
  private readonly jobStatsRepository: JobStatsRepository

  constructor(
    private readonly queues: Queue[],
    jobStatsRepository?: JobStatsRepository,
  ) {
    this.jobStatsRepository = jobStatsRepository ?? new JobStatsRepository()

    this.worker = new Worker<AnalyticsAggregationJobPayload>(
      ANALYTICS_AGGREGATION_QUEUE,
      async (job: Job<AnalyticsAggregationJobPayload>) => {
        Logger.apiInfo('[AnalyticsAggregationWorker] Processing analytics aggregation job', {
          jobId: job.id,
          triggeredAt: job.data.triggeredAt,
        })
        await this.runOnce()
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[AnalyticsAggregationWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[AnalyticsAggregationWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  /**
   * Run the aggregation pass for the previous calendar day.
   * Public so it can be called directly in tests.
   */
  async runOnce(targetDate?: Date): Promise<void> {
    const now = targetDate ?? new Date()

    // Previous day boundaries (UTC)
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0, 0),
    )
    const dayEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    )

    Logger.apiInfo('[AnalyticsAggregationWorker] Aggregating stats', {
      dayStart,
      dayEnd,
    })

    await Promise.all([
      this.aggregateDailyStats(dayStart, dayEnd),
      this.aggregateJobStats(dayStart),
    ])
  }

  private async aggregateDailyStats(dayStart: Date, dayEnd: Date): Promise<void> {
    // Total orders placed in the day
    const totalOrders = await OrderModel.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: ORDER_STATUS.CANCELLED },
    })

    // Total revenue from delivered orders
    const revenueResult = await OrderModel.aggregate<{ total: number }>([
      {
        $match: {
          createdAt: { $gte: dayStart, $lt: dayEnd },
          status: ORDER_STATUS.DELIVERED,
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])
    const totalRevenue = revenueResult[0]?.total ?? 0

    // Top 10 products by order count
    const topProductsResult = await OrderModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: dayStart, $lt: dayEnd },
          status: { $ne: ORDER_STATUS.CANCELLED },
        },
      },
      { $unwind: '$items' },
      { $group: { _id: { $toString: '$items.product' }, count: { $sum: '$items.buy_count' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])
    const topProductIds = topProductsResult.map((r) => r._id)

    // New users registered on that day
    const newUsers = await UserModel.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd },
    })

    await DailyStatsModel.findOneAndUpdate(
      { date: dayStart },
      { $set: { totalOrders, totalRevenue, topProductIds, newUsers } },
      { upsert: true, new: true },
    )

    Logger.apiInfo('[AnalyticsAggregationWorker] Daily stats upserted', {
      date: dayStart,
      totalOrders,
      totalRevenue,
      newUsers,
    })
  }

  private async aggregateJobStats(date: Date): Promise<void> {
    for (const queue of this.queues) {
      try {
        const [completed, failed] = await Promise.all([
          queue.getCompletedCount(),
          queue.getFailedCount(),
        ])

        // BullMQ does not expose duration metrics natively; default to 0
        await this.jobStatsRepository.upsert({
          queue: queue.name,
          date,
          completed,
          failed,
          avgDurationMs: 0,
          p95DurationMs: 0,
        })
      } catch (err) {
        Logger.apiWarn('[AnalyticsAggregationWorker] Failed to aggregate job stats for queue', {
          queue: queue.name,
          error: (err as Error).message,
        })
      }
    }

    Logger.apiInfo('[AnalyticsAggregationWorker] Job stats upserted', {
      queueCount: this.queues.length,
    })
  }
}
