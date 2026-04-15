import { ProductModel } from '@database/models/product.model'
import { Logger } from '@utils/logger'

/**
 * Batch view counter service
 * Buffers product view increments and flushes to DB periodically
 * to reduce database write operations
 */
class ViewCounterService {
  private viewBuffer: Map<string, number> = new Map()
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL_MS = 30 * 1000 // 30 seconds
  private readonly BUFFER_THRESHOLD = 100 // Flush when buffer reaches this size

  constructor() {
    this.startPeriodicFlush()
  }

  /**
   * Increment view count for a product (buffered)
   */
  incrementView(productId: string): void {
    const currentCount = this.viewBuffer.get(productId) || 0
    this.viewBuffer.set(productId, currentCount + 1)

    // Flush immediately if buffer threshold reached
    if (this.viewBuffer.size >= this.BUFFER_THRESHOLD) {
      this.flushViews().catch((err) => {
        Logger.apiError('Failed to flush views on threshold', err)
      })
    }
  }

  /**
   * Flush all buffered views to database
   */
  async flushViews(): Promise<void> {
    if (this.viewBuffer.size === 0) return

    const entries = Array.from(this.viewBuffer.entries())
    this.viewBuffer.clear()

    try {
      const bulkOps = entries.map(([productId, count]) => ({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { view: count } },
        },
      }))

      await ProductModel.bulkWrite(bulkOps)
      Logger.apiInfo(`Flushed ${entries.length} product view counts to database`)
    } catch (error) {
      // On error, restore the counts to buffer for retry
      entries.forEach(([productId, count]) => {
        const currentCount = this.viewBuffer.get(productId) || 0
        this.viewBuffer.set(productId, currentCount + count)
      })
      Logger.apiError('Failed to flush view counts', error)
      throw error
    }
  }

  /**
   * Start periodic flush interval
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushViews().catch((err) => {
        Logger.apiError('Periodic flush failed', err)
      })
    }, this.FLUSH_INTERVAL_MS)
  }

  /**
   * Stop periodic flush and flush remaining views
   * Call this on graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Final flush
    await this.flushViews()
    Logger.apiInfo('View counter service shut down')
  }

  /**
   * Get current buffer size (for monitoring)
   */
  getBufferSize(): number {
    return this.viewBuffer.size
  }
}

// Singleton instance
export const viewCounterService = new ViewCounterService()
