import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, FlashSaleTickPayload, FlashSaleStockUpdatePayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'
import { getFlashSale, setFlashSaleTimer, endFlashSale } from '../managers/flash-sale.manager'

/**
 * Start the flash sale timer that emits tick events every second
 * @param saleId - The flash sale ID
 */
export const startFlashSaleTimer = (saleId: string): void => {
  try {
    const interval = setInterval(() => {
      try {
        const sale = getFlashSale(saleId)
        if (!sale) {
          clearInterval(interval)
          return
        }

        const remainingMs = sale.end_time.getTime() - Date.now()
        if (remainingMs <= 0) {
          endFlashSale(saleId)
          clearInterval(interval)
          return
        }

        const io = getIORequired()
        const room = `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}${saleId}`
        const products = Array.from(sale.products.values()).map((p) => ({
          product_id: p.product_id,
          current_stock: p.current_stock,
          sold: p.sold,
        }))

        const payload: FlashSaleTickPayload = {
          sale_id: saleId,
          remaining_seconds: Math.ceil(remainingMs / 1000),
          products,
        }

        io.to(room).emit(SocketEvent.FLASH_SALE_TICK, payload)
      } catch (error) {
        Logger.apiError('Error in flash sale tick', {
          saleId,
          error: error instanceof Error ? error.message : error,
        })
      }
    }, 1000)

    setFlashSaleTimer(saleId, interval)
    Logger.apiInfo('Flash sale timer started', { saleId })
  } catch (error) {
    Logger.apiError('Failed to start flash sale timer', {
      saleId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a flash sale stock update when a purchase is made
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
  buyerName?: string
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

