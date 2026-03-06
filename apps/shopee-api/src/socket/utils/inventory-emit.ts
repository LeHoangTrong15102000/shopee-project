import { SOCKET_CONFIG } from '@constants/socket'
import { ROLE } from '@constants/role.enum'
import { NotificationModel } from '@database/models/notification.model'
import { UserModel } from '@database/models/user.model'
import { SocketEvent, InventoryAlertPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit an inventory alert to the admin notifications room
 * @param productId - The product ID
 * @param productName - The product name
 * @param currentQuantity - Current stock quantity
 * @param threshold - The low stock threshold
 */
export const emitInventoryAlert = (
  productId: string,
  productName: string,
  currentQuantity: number,
  threshold: number
): void => {
  try {
    const io = getIORequired()
    const adminRoom = `${SOCKET_CONFIG.ROOM_PREFIX.ADMIN}notifications`

    const severity: 'warning' | 'critical' = currentQuantity === 0 ? 'critical' : 'warning'

    const payload: InventoryAlertPayload = {
      product_id: productId,
      product_name: productName,
      current_quantity: currentQuantity,
      threshold,
      severity,
    }

    io.to(adminRoom).emit(SocketEvent.INVENTORY_ALERT, payload)

    Logger.apiInfo('Inventory alert emitted to admin room', {
      productId,
      productName,
      currentQuantity,
      threshold,
      severity,
    })

    // Persist inventory alert as notification for admin users (fire-and-forget)
    void (async () => {
      try {
        const adminUsers = await UserModel.find({ roles: ROLE.ADMIN }).select('_id').lean()

        if (adminUsers.length > 0) {
          const title =
            severity === 'critical' ? `🚨 Hết hàng: ${productName}` : `⚠️ Sắp hết hàng: ${productName}`
          const content =
            currentQuantity === 0
              ? `Sản phẩm "${productName}" đã hết hàng!`
              : `Sản phẩm "${productName}" chỉ còn ${currentQuantity} sản phẩm (ngưỡng: ${threshold}).`

          const notifications = adminUsers.map((admin) => ({
            user: admin._id,
            title,
            content,
            type: 'system' as const,
            is_read: false,
          }))

          await NotificationModel.insertMany(notifications)
          Logger.apiInfo('Inventory alert persisted as notifications', {
            productId,
            adminCount: adminUsers.length,
          })
        }
      } catch (persistError) {
        Logger.apiError('Failed to persist inventory alert notification', {
          productId,
          error: persistError instanceof Error ? persistError.message : persistError,
        })
      }
    })()
  } catch (error) {
    Logger.apiError('Failed to emit inventory alert', {
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

