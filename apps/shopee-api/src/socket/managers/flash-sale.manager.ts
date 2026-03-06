import { Logger } from '@utils/logger'

interface FlashSaleProduct {
  product_id: string
  initial_stock: number
  current_stock: number
  sold: number
}

interface FlashSaleEntry {
  sale_id: string
  end_time: Date
  products: Map<string, FlashSaleProduct>
  timer_interval: ReturnType<typeof setInterval> | null
}

// In-memory flash sale store: saleId -> FlashSaleEntry
const flashSaleMap = new Map<string, FlashSaleEntry>()

/**
 * Start a new flash sale
 * @param saleId - The flash sale ID
 * @param endTime - When the flash sale ends
 * @param products - Array of products with their stock
 */
export const startFlashSale = (
  saleId: string,
  endTime: Date,
  products: { product_id: string; stock: number }[]
): void => {
  const productMap = new Map<string, FlashSaleProduct>()
  for (const p of products) {
    productMap.set(p.product_id, {
      product_id: p.product_id,
      initial_stock: p.stock,
      current_stock: p.stock,
      sold: 0,
    })
  }
  flashSaleMap.set(saleId, {
    sale_id: saleId,
    end_time: endTime,
    products: productMap,
    timer_interval: null,
  })
  Logger.apiInfo('Flash sale started', {
    saleId,
    endTime: endTime.toISOString(),
    productCount: products.length,
  })
}

/**
 * End a flash sale and clean up resources
 * @param saleId - The flash sale ID
 */
export const endFlashSale = (saleId: string): void => {
  const entry = flashSaleMap.get(saleId)
  if (entry?.timer_interval) {
    clearInterval(entry.timer_interval)
  }
  flashSaleMap.delete(saleId)
  Logger.apiInfo('Flash sale ended', { saleId })
}

/**
 * Get a flash sale entry by ID
 * @param saleId - The flash sale ID
 */
export const getFlashSale = (saleId: string): FlashSaleEntry | undefined =>
  flashSaleMap.get(saleId)

/**
 * Get all active flash sales
 */
export const getActiveFlashSales = (): FlashSaleEntry[] =>
  Array.from(flashSaleMap.values())

/**
 * Set the timer interval for a flash sale
 * @param saleId - The flash sale ID
 * @param interval - The interval reference
 */
export const setFlashSaleTimer = (
  saleId: string,
  interval: ReturnType<typeof setInterval>
): void => {
  const entry = flashSaleMap.get(saleId)
  if (entry) {
    entry.timer_interval = interval
  }
}

/**
 * Decrement stock for a product in a flash sale
 * @param saleId - The flash sale ID
 * @param productId - The product ID
 * @param quantity - Amount to decrement (default: 1)
 * @returns The updated product or null if not found/insufficient stock
 */
export const decrementStock = (
  saleId: string,
  productId: string,
  quantity: number = 1
): FlashSaleProduct | null => {
  const entry = flashSaleMap.get(saleId)
  if (!entry) return null

  const product = entry.products.get(productId)
  if (!product || product.current_stock < quantity) return null

  product.current_stock -= quantity
  product.sold += quantity

  Logger.apiInfo('Flash sale stock decremented', {
    saleId,
    productId,
    currentStock: product.current_stock,
    sold: product.sold,
  })

  return product
}

