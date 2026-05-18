import { Logger } from '@utils/logger'
import { config } from '@constants/config'
import { FlashSaleService } from './flash-sale.service'
import { IFlashSale, IFlashSaleProduct } from '../@types/models.type'

export class FlashSaleScheduler {
  private intervalHandle: ReturnType<typeof setInterval> | null = null

  constructor(private readonly flashSaleService: FlashSaleService) {}

  /**
   * Start the scheduler.
   * Immediately runs a check, then repeats every FLASH_SALE_CHECK_INTERVAL seconds.
   */
  async start(): Promise<void> {
    Logger.apiInfo('FlashSaleScheduler starting', {
      intervalSeconds: config.FLASH_SALE_CHECK_INTERVAL,
    })

    // Run immediately on startup to recover from server restarts
    await this._runCheck()

    this.intervalHandle = setInterval(() => {
      this._runCheck().catch((err) => {
        Logger.apiError('FlashSaleScheduler check failed', {
          error: err?.message,
        })
      })
    }, config.FLASH_SALE_CHECK_INTERVAL * 1000)
  }

  /**
   * Stop the scheduler and clear the interval.
   */
  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
      Logger.apiInfo('FlashSaleScheduler stopped')
    }
  }

  // ─── Private ─────────────────────────────────────────────────────

  private async _runCheck(): Promise<void> {
    const now = new Date()

    try {
      await this._activateScheduled(now)
    } catch (err) {
      Logger.apiError('FlashSaleScheduler: error activating scheduled sales', {
        error: (err as Error)?.message,
      })
    }

    try {
      await this._endExpired(now)
    } catch (err) {
      Logger.apiError('FlashSaleScheduler: error ending expired sales', {
        error: (err as Error)?.message,
      })
    }
  }

  /**
   * Activate SCHEDULED flash sales whose startTime has passed.
   */
  private async _activateScheduled(now: Date): Promise<void> {
    const { FlashSaleModel } = await import('@database/models/flash-sale.model')

    const toActivate = await FlashSaleModel.find({
      status: 'SCHEDULED',
      startTime: { $lte: now },
    }).lean()

    for (const sale of toActivate) {
      try {
        await FlashSaleModel.findByIdAndUpdate(sale._id, { $set: { status: 'ACTIVE' } })

        Logger.apiInfo('FlashSaleScheduler: activated flash sale', {
          id: sale._id?.toString(),
          name: sale.name,
        })

        // Emit WebSocket broadcast
        this._broadcastActivated(sale as IFlashSale)

        // Write audit log (system actor)
        this._writeAuditLog('FLASH_SALE_AUTO_ACTIVATE', sale as IFlashSale)
      } catch (err) {
        Logger.apiError('FlashSaleScheduler: failed to activate flash sale', {
          id: sale._id?.toString(),
          error: (err as Error)?.message,
        })
      }
    }
  }

  /**
   * End ACTIVE flash sales whose endTime has passed.
   */
  private async _endExpired(now: Date): Promise<void> {
    const { FlashSaleModel } = await import('@database/models/flash-sale.model')

    const toEnd = await FlashSaleModel.find({
      status: 'ACTIVE',
      endTime: { $lte: now },
    }).lean()

    for (const sale of toEnd) {
      try {
        await FlashSaleModel.findByIdAndUpdate(sale._id, { $set: { status: 'ENDED' } })

        Logger.apiInfo('FlashSaleScheduler: ended flash sale', {
          id: sale._id?.toString(),
          name: sale.name,
        })

        // Emit WebSocket broadcast
        this._broadcastEnded(sale as IFlashSale)

        // Write audit log (system actor)
        this._writeAuditLog('FLASH_SALE_AUTO_DEACTIVATE', sale as IFlashSale)
      } catch (err) {
        Logger.apiError('FlashSaleScheduler: failed to end flash sale', {
          id: sale._id?.toString(),
          error: (err as Error)?.message,
        })
      }
    }
  }

  /**
   * Broadcast flash sale activated event to all connected WebSocket clients.
   */
  private _broadcastActivated(sale: IFlashSale): void {
    try {
      const { getIO } = require('../socket/socket.init')
      const io = getIO()
      if (!io) return

      io.emit('flash_sale_activated', {
        sale_id: sale._id?.toString(),
        name: sale.name,
        startTime: sale.startTime,
        endTime: sale.endTime,
        products: sale.products.map((p: IFlashSaleProduct) => ({
          product_id: p.productId.toString(),
          flash_price: p.flashPrice,
          original_price: p.originalPrice,
          total_quantity: p.totalQuantity,
          sold_quantity: p.soldQuantity,
          remaining_quantity: p.totalQuantity - p.soldQuantity,
        })),
      })

      // Also start the flash sale timer for tick events
      const { startFlashSaleTimer } = require('../socket/utils/flash-sale-emit')
      startFlashSaleTimer(sale._id?.toString() || '', sale.endTime, sale.products)
    } catch (err) {
      Logger.apiError('FlashSaleScheduler: failed to broadcast activation', {
        saleId: sale._id?.toString(),
        error: (err as Error)?.message,
      })
    }
  }

  /**
   * Broadcast flash sale ended event to all connected WebSocket clients.
   */
  private _broadcastEnded(sale: IFlashSale): void {
    try {
      const { getIO } = require('../socket/socket.init')
      const io = getIO()
      if (!io) return

      io.emit('flash_sale_ended', {
        sale_id: sale._id?.toString(),
        name: sale.name,
        endTime: sale.endTime,
      })
    } catch (err) {
      Logger.apiError('FlashSaleScheduler: failed to broadcast end', {
        saleId: sale._id?.toString(),
        error: (err as Error)?.message,
      })
    }
  }

  /**
   * Write an audit log entry for automated status changes.
   * Uses system actor (performedBy: null).
   */
  private _writeAuditLog(action: string, sale: IFlashSale): void {
    import('../container')
      .then(({ auditLogService }) => {
        auditLogService.writeLog({
          action,
          resource: 'flash-sale',
          resourceId: sale._id?.toString() ?? null,
          actor: {
            userId: 'system',
            roles: ['system'],
          },
          before: null,
          after: null,
          diff: null,
          ip: 'system',
          userAgent: 'FlashSaleScheduler',
          status: 'success',
        })
      })
      .catch((err) => {
        Logger.apiWarn('FlashSaleScheduler: failed to write audit log', {
          action,
          saleId: sale._id?.toString(),
          error: err?.message,
        })
      })
  }
}
