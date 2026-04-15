import { SOCKET_CONFIG } from '@constants/socket'
import { ROLE } from '@constants/role.enum'
import { PurchaseModel } from '@database/models/purchase.model'
import { UserModel } from '@database/models/user.model'
import {
  SocketEvent,
  OrderStatusUpdatedPayload,
  AdminNewOrderPayload,
} from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'
import { pushNotification } from '../handlers/notification.handler'
import { emitCurrentSellerMetrics } from './seller-metrics.service'

/**
 * Emit an order status update to all users subscribed to the order room
 * @param orderId - The order ID
 * @param oldStatus - Previous order status
 * @param newStatus - New order status
 * @param message - Optional message about the status change
 */
export const emitOrderStatusUpdate = (
  orderId: string,
  oldStatus: string,
  newStatus: string,
  message?: string,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.ORDER}${orderId}`

    const payload: OrderStatusUpdatedPayload = {
      order_id: orderId,
      old_status: oldStatus,
      new_status: newStatus,
      updated_at: new Date().toISOString(),
      message,
    }

    io.to(room).emit(SocketEvent.ORDER_STATUS_UPDATED, payload)

    Logger.apiInfo('Order status update emitted', {
      orderId,
      room,
      oldStatus,
      newStatus,
    })

    // Persist order status notification for the user via pushNotification (fire-and-forget)
    void (async () => {
      try {
        const purchase = await PurchaseModel.findById(orderId).select('user').lean()

        if (!purchase || !purchase.user) {
          Logger.apiWarn('Purchase not found for notification persistence', { orderId })
          return
        }

        const getTitle = (status: string): string => {
          switch (status) {
            case 'confirmed':
              return '📦 Đơn hàng đã được xác nhận'
            case 'processing':
              return '⚙️ Đơn hàng đang được xử lý'
            case 'shipping':
              return '🚚 Đơn hàng đang được giao'
            case 'delivered':
              return '🎉 Đơn hàng đã giao thành công'
            case 'cancelled':
              return '❌ Đơn hàng đã bị hủy'
            case 'returned':
              return '↩️ Đơn hàng đã được trả lại'
            default:
              return '📋 Cập nhật đơn hàng'
          }
        }

        const title = getTitle(newStatus)
        const content =
          message || `Trạng thái đơn hàng đã thay đổi từ ${oldStatus} sang ${newStatus}`

        await pushNotification(io, purchase.user.toString(), {
          title,
          content,
          type: 'order',
          link: '/user/purchase',
        })

        Logger.apiInfo('Order status notification persisted via pushNotification', {
          orderId,
          userId: purchase.user,
          newStatus,
        })
      } catch (persistError) {
        Logger.apiError('Failed to persist order status notification', {
          orderId,
          error: persistError instanceof Error ? persistError.message : persistError,
        })
      }
    })()

    // Fire-and-forget: refresh seller metrics for all subscribed seller dashboard rooms
    void (async () => {
      try {
        const rooms = io.sockets.adapter.rooms
        const sellerPrefix = SOCKET_CONFIG.ROOM_PREFIX.SELLER
        for (const [roomName, sockets] of rooms) {
          if (roomName.startsWith(sellerPrefix) && sockets.size > 0) {
            const sellerId = roomName.slice(sellerPrefix.length)
            await emitCurrentSellerMetrics(sellerId)
          }
        }
      } catch (refreshError) {
        Logger.apiError('Failed to refresh seller metrics after order update', {
          orderId,
          error: refreshError instanceof Error ? refreshError.message : refreshError,
        })
      }
    })()
  } catch (error) {
    Logger.apiError('Failed to emit order status update', {
      orderId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit admin new order notification to all admin users.
 * Queries users with Admin role, emits ADMIN_NEW_ORDER event to each admin's user room,
 * and persists notification via pushNotification (fire-and-forget).
 */
export const emitAdminNewOrderNotification = (payload: AdminNewOrderPayload): void => {
  void (async () => {
    try {
      const io = getIORequired()
      const admins = await UserModel.find({ roles: ROLE.ADMIN }).select('_id').lean()

      for (const admin of admins) {
        const adminId = admin._id.toString()
        const userRoom = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${adminId}`

        io.to(userRoom).emit(SocketEvent.ADMIN_NEW_ORDER, payload)

        await pushNotification(io, adminId, {
          title: '🛒 Đơn hàng mới',
          content: `${payload.buyer_name} vừa đặt ${payload.items_count} sản phẩm - ${payload.total_amount.toLocaleString('vi-VN')}₫`,
          type: 'order',
          link: '/admin/orders',
        })
      }

      Logger.apiInfo('Admin new order notification emitted', {
        orderId: payload.order_id,
        adminCount: admins.length,
      })
    } catch (error) {
      Logger.apiError('Failed to emit admin new order notification', {
        orderId: payload.order_id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })()
}
