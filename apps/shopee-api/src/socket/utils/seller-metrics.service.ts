import { PurchaseModel } from '@database/models/purchase.model'
import { QuestionModel } from '@database/models/question.model'
import { STATUS_PURCHASE } from '@constants/purchase'
import { SOCKET_CONFIG } from '@constants/socket'
import { SellerMetricsUpdatePayload } from '../../@types/socket.type'
import { emitSellerMetricsUpdate } from './seller-emit'
import { getOnlineUserCount } from '../managers/presence.manager'
import { getIO } from '../socket.init'
import { Logger } from '@utils/logger'

/**
 * Get aggregated seller metrics from the database
 * Queries today's orders, revenue, pending orders, and unanswered Q&A
 */
export const getSellerMetrics = async (): Promise<SellerMetricsUpdatePayload> => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Today's orders: purchases created today with status >= WAIT_FOR_CONFIRMATION
    const todayPurchases = await PurchaseModel.find({
      status: { $gte: STATUS_PURCHASE.WAIT_FOR_CONFIRMATION },
      createdAt: { $gte: todayStart },
    }).lean()

    const today_orders = todayPurchases.length
    const today_revenue = todayPurchases.reduce(
      (sum, p: any) => sum + (p.price || 0) * (p.buy_count || 0),
      0
    )

    // Pending orders: status = WAIT_FOR_CONFIRMATION (1)
    const pending_orders = await PurchaseModel.countDocuments({
      status: STATUS_PURCHASE.WAIT_FOR_CONFIRMATION,
    })

    // Pending Q&A: questions with zero answers
    const pending_qa = await QuestionModel.countDocuments({
      $or: [
        { answers: { $size: 0 } },
        { answers: { $exists: false } },
      ],
    })

    // Active users: currently online user count
    const active_users = getOnlineUserCount()

    // Orders per hour: today_orders / hours elapsed since midnight (min 1 hour)
    const now = new Date()
    const hoursElapsed = Math.max(1, (now.getTime() - todayStart.getTime()) / (1000 * 60 * 60))
    const orders_per_hour = Math.round((today_orders / hoursElapsed) * 10) / 10

    return { today_orders, today_revenue, pending_orders, pending_qa, active_users, orders_per_hour }
  } catch (error) {
    Logger.apiError('Failed to get seller metrics', {
      error: error instanceof Error ? error.message : error,
    })
    return { today_orders: 0, today_revenue: 0, pending_orders: 0, pending_qa: 0, active_users: 0, orders_per_hour: 0 }
  }
}

/**
 * Get current seller metrics from DB and emit to seller dashboard room
 * Fire-and-forget: errors are logged but not thrown
 */
export const emitCurrentSellerMetrics = async (sellerId: string): Promise<void> => {
  try {
    const metrics = await getSellerMetrics()
    emitSellerMetricsUpdate(sellerId, metrics)

    Logger.apiInfo('Seller metrics emitted with real data', {
      sellerId,
      metrics,
    })
  } catch (error) {
    Logger.apiError('Failed to emit current seller metrics', {
      sellerId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

// ─── Periodic Metrics ─────────────────────────────────────────

const PERIODIC_INTERVAL_MS = 30_000 // 30 seconds
let periodicIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * Start periodic seller metrics emission.
 * Every 30 seconds, checks if any seller dashboard rooms have subscribers.
 * If subscribers exist, emits fresh metrics to each subscribed seller room.
 * If no subscribers, skips DB queries to avoid unnecessary load.
 */
export const startPeriodicSellerMetrics = (): void => {
  if (periodicIntervalId) {
    Logger.apiWarn('Periodic seller metrics already running, skipping duplicate start')
    return
  }

  periodicIntervalId = setInterval(async () => {
    try {
      const io = getIO()
      if (!io) return

      const rooms = io.sockets.adapter.rooms
      const sellerPrefix = SOCKET_CONFIG.ROOM_PREFIX.SELLER
      const subscribedSellerIds: string[] = []

      for (const [roomName, sockets] of rooms) {
        if (roomName.startsWith(sellerPrefix) && sockets.size > 0) {
          subscribedSellerIds.push(roomName.slice(sellerPrefix.length))
        }
      }

      if (subscribedSellerIds.length === 0) return

      const metrics = await getSellerMetrics()
      for (const sellerId of subscribedSellerIds) {
        emitSellerMetricsUpdate(sellerId, metrics)
      }

      Logger.apiInfo('Periodic seller metrics emitted', {
        subscriberCount: subscribedSellerIds.length,
      })
    } catch (error) {
      Logger.apiError('Failed periodic seller metrics emission', {
        error: error instanceof Error ? error.message : error,
      })
    }
  }, PERIODIC_INTERVAL_MS)

  Logger.apiInfo('Periodic seller metrics started', { intervalMs: PERIODIC_INTERVAL_MS })
}

/**
 * Stop periodic seller metrics emission (for graceful shutdown)
 */
export const stopPeriodicSellerMetrics = (): void => {
  if (periodicIntervalId) {
    clearInterval(periodicIntervalId)
    periodicIntervalId = null
    Logger.apiInfo('Periodic seller metrics stopped')
  }
}

