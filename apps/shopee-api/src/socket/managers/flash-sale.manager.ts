import { Logger } from '@utils/logger'
import { IFlashSale } from '../../@types/models.type'

// Re-export timer functions from flash-sale-emit.ts (single source of truth)
export { clearFlashSaleTimer } from '../utils/flash-sale-emit'

/**
 * Get all currently ACTIVE flash sales from the database.
 * Replaces the old in-memory Map lookup.
 */
export const getActiveFlashSales = async (): Promise<IFlashSale[]> => {
  const { flashSaleService } = await import('../../container')
  return flashSaleService.getActive()
}

/**
 * Decrement stock for a product in a flash sale via the database.
 * Replaces the old in-memory decrementStock.
 * Returns the updated flash sale or null if sold out / not found.
 */
export const decrementStock = async (
  saleId: string,
  productId: string,
  userId: string,
  quantity = 1,
): Promise<IFlashSale | null> => {
  try {
    const { flashSaleService } = await import('../../container')
    const updated = await flashSaleService.purchaseFlashSaleItem(
      saleId,
      productId,
      userId,
      quantity,
    )
    Logger.apiInfo('Flash sale stock decremented', {
      saleId,
      productId,
      quantity,
    })
    return updated
  } catch (err) {
    Logger.apiError('Flash sale stock decrement failed', {
      saleId,
      productId,
      error: (err as Error)?.message,
    })
    return null
  }
}
