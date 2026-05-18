import { SOCKET_CONFIG } from '@constants/socket'
import {
  SocketEvent,
  FlashSaleTickPayload,
  FlashSaleStockUpdatePayload,
} from '../../@types/socket.type'
import { IFlashSaleProduct } from '../../@types/models.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

// Module-level timer store (process-local, no dependency on manager)
const timerMap = new Map<string, ReturnType<typeof setInterval>>()

/**
 * Clear and remove the timer for a flash sale.
 */
export const clearFlashSaleTimer = (saleId: string): void => {
  const interval = timerMap.get(saleId)
  if (interval !== undefined) {
    clearInterval(interval)
    timerMap.delete(saleId)
    Logger.apiInfo('Flash sale timer cleared', { saleId })
  }
}

/**
 * Start the flash sale timer that emits tick events every second.
 * Uses parameter-based approach to avoid circular dependency with container.ts.
 *
 * @param saleId - The flash sale ID
 * @param endTime - When the flash sale ends
 * @param products - Current product list with stock data
 */
export const startFlashSaleTimer = (
  saleId: string,
  endTime: Date,
  products: IFlashSaleProduct[],
): void => {
  try {
    const interval = setInterval(() => {
      try {
        const remainingMs = endTime.getTime() - Date.now()
        if (remainingMs <= 0) {
          clearFlashSaleTimer(saleId)
          return
        }

        const io = getIORequired()
        const room = `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}${saleId}`

        const tickProducts = products.map((p) => ({
          product_id: p.productId.toString(),
          current_stock: p.totalQuantity - p.soldQuantity,
          sold: p.soldQuantity,
        }))

        const payload: FlashSaleTickPayload = {
          sale_id: saleId,
          remaining_seconds: Math.ceil(remainingMs / 1000),
          products: tickProducts,
        }

        io.to(room).emit(SocketEvent.FLASH_SALE_TICK, payload)
      } catch (error) {
        Logger.apiError('Error in flash sale tick', {
          saleId,
          error: error instanceof Error ? error.message : error,
        })
      }
    }, 1000)

    timerMap.set(saleId, interval)
    Logger.apiInfo('Flash sale timer started', { saleId, endTime: endTime.toISOString() })
  } catch (error) {
    Logger.apiError('Failed to start flash sale timer', {
      saleId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a flash sale stock update when a purchase is made.
 *
 * @param saleId - The flash sale ID
 * @param productId - The product ID
 * @param currentStock - Current stock after purchase
 * @param sold - Total sold count
 * @param buyerName - Optional buyer name for display
 */
export const emitFlashSaleStockUpdate = (
  saleId: string,
  productId: string,
  currentStock: number,
  sold: number,
  buyerName?: string,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}${saleId}`

    const payload: FlashSaleStockUpdatePayload = {
      sale_id: saleId,
      product_id: productId,
      current_stock: currentStock,
      sold,
      buyer_name: buyerName,
    }

    io.to(room).emit(SocketEvent.FLASH_SALE_STOCK_UPDATE, payload)

    Logger.apiInfo('Flash sale stock update emitted', {
      saleId,
      productId,
      currentStock,
      sold,
    })
  } catch (error) {
    Logger.apiError('Failed to emit flash sale stock update', {
      saleId,
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}
