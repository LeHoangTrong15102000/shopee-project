/**
 * FlashSaleScheduler — registers a BullMQ repeatable job for flash sale activation/expiry checks.
 *
 * Replaces the old setInterval pattern. The actual processing logic lives in
 * FlashSaleSchedulerWorker. This class only manages the repeatable job registration.
 */
import { Logger } from '@utils/logger'
import { config } from '@constants/config'
import { flashSaleSchedulerQueue } from '../queues'

export class FlashSaleScheduler {
  /**
   * Register the BullMQ repeatable job.
   * Runs every FLASH_SALE_CHECK_INTERVAL seconds (default 60s).
   * BullMQ workers auto-start when instantiated in container.ts.
   */
  async start(): Promise<void> {
    const intervalSeconds = config.FLASH_SALE_CHECK_INTERVAL || 60
    const repeatEveryMs = intervalSeconds * 1000

    Logger.apiInfo('[FlashSaleScheduler] Registering BullMQ repeatable job', {
      intervalSeconds,
    })

    await flashSaleSchedulerQueue.add(
      'flash-sale-check',
      { triggeredAt: new Date().toISOString() },
      {
        repeat: { every: repeatEveryMs },
        jobId: 'flash-sale-check-repeatable',
      },
    )

    Logger.apiInfo('[FlashSaleScheduler] Repeatable job registered')
  }

  /**
   * No-op stop — BullMQ workers are managed by their own lifecycle.
   * Kept for backward compatibility with index.ts graceful shutdown.
   */
  stop(): void {
    Logger.apiInfo('[FlashSaleScheduler] stop() called — BullMQ manages worker lifecycle')
  }
}
