/**
 * FlashSaleSchedulerWorker — processes jobs from the `flash-sale-scheduler` queue.
 *
 * Migrates the logic from FlashSaleScheduler._activateScheduled() and ._endExpired()
 * into a BullMQ worker. Preserves Socket.IO broadcasts and audit log writes.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { FLASH_SALE_SCHEDULER_QUEUE } from '../queues/queue.config'
import { FlashSaleSchedulerJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { IFlashSale, IFlashSaleProduct } from '../@types/models.type'
import { EventBus } from '../events/event-bus'

export class FlashSaleSchedulerWorker {
  readonly worker: Worker
  private eventBus?: EventBus

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus

    this.worker = new Worker<FlashSaleSchedulerJobPayload>(
      FLASH_SALE_SCHEDULER_QUEUE,
      async (job: Job<FlashSaleSchedulerJobPayload>) => {
        Logger.apiInfo('[FlashSaleSchedulerWorker] Running flash sale check', {
          jobId: job.id,
          triggeredAt: job.data.triggeredAt,
        })

        const now = new Date()

        try {
          await this._activateScheduled(now)
        } catch (err) {
          Logger.apiError('[FlashSaleSchedulerWorker] Error activating scheduled sales', {
            error: (err as Error)?.message,
          })
        }

        try {
          await this._endExpired(now)
        } catch (err) {
          Logger.apiError('[FlashSaleSchedulerWorker] Error ending expired sales', {
            error: (err as Error)?.message,
          })
        }
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[FlashSaleSchedulerWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[FlashSaleSchedulerWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  /**
   * Activate SCHEDULED flash sales whose startTime has passed.
   */
  async _activateScheduled(now: Date): Promise<void> {
    const { FlashSaleModel } = await import('@database/models/flash-sale.model')

    const toActivate = await FlashSaleModel.find({
      status: 'SCHEDULED',
      startTime: { $lte: now },
    }).lean()

    for (const sale of toActivate) {
      try {
        await FlashSaleModel.findByIdAndUpdate(sale._id, { $set: { status: 'ACTIVE' } })

        Logger.apiInfo('[FlashSaleSchedulerWorker] Activated flash sale', {
          id: sale._id?.toString(),
          name: sale.name,
        })

        this._broadcastActivated(sale as IFlashSale)
        this._writeAuditLog('FLASH_SALE_AUTO_ACTIVATE', sale as IFlashSale)

        // Emit domain event
        if (this.eventBus) {
          this.eventBus.emit({
            type: 'flash_sale.started',
            payload: {
              saleId: sale._id?.toString() ?? '',
              name: sale.name,
              startTime: sale.startTime,
              endTime: sale.endTime,
            },
          })
        }
      } catch (err) {
        Logger.apiError('[FlashSaleSchedulerWorker] Failed to activate flash sale', {
          id: sale._id?.toString(),
          error: (err as Error)?.message,
        })
      }
    }
  }

  /**
   * End ACTIVE flash sales whose endTime has passed.
   */
  async _endExpired(now: Date): Promise<void> {
    const { FlashSaleModel } = await import('@database/models/flash-sale.model')

    const toEnd = await FlashSaleModel.find({
      status: 'ACTIVE',
      endTime: { $lte: now },
    }).lean()

    for (const sale of toEnd) {
      try {
        await FlashSaleModel.findByIdAndUpdate(sale._id, { $set: { status: 'ENDED' } })

        Logger.apiInfo('[FlashSaleSchedulerWorker] Ended flash sale', {
          id: sale._id?.toString(),
          name: sale.name,
        })

        this._broadcastEnded(sale as IFlashSale)
        this._writeAuditLog('FLASH_SALE_AUTO_DEACTIVATE', sale as IFlashSale)

        // Emit domain event
        if (this.eventBus) {
          this.eventBus.emit({
            type: 'flash_sale.ended',
            payload: {
              saleId: sale._id?.toString() ?? '',
              name: sale.name,
              endTime: sale.endTime,
            },
          })
        }
      } catch (err) {
        Logger.apiError('[FlashSaleSchedulerWorker] Failed to end flash sale', {
          id: sale._id?.toString(),
          error: (err as Error)?.message,
        })
      }
    }
  }

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

      const { startFlashSaleTimer } = require('../socket/utils/flash-sale-emit')
      startFlashSaleTimer(sale._id?.toString() || '', sale.endTime, sale.products)
    } catch (err) {
      Logger.apiError('[FlashSaleSchedulerWorker] Failed to broadcast activation', {
        saleId: sale._id?.toString(),
        error: (err as Error)?.message,
      })
    }
  }

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
      Logger.apiError('[FlashSaleSchedulerWorker] Failed to broadcast end', {
        saleId: sale._id?.toString(),
        error: (err as Error)?.message,
      })
    }
  }

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
          userAgent: 'FlashSaleSchedulerWorker',
          status: 'success',
        })
      })
      .catch((err) => {
        Logger.apiWarn('[FlashSaleSchedulerWorker] Failed to write audit log', {
          action,
          saleId: sale._id?.toString(),
          error: err?.message,
        })
      })
  }
}
