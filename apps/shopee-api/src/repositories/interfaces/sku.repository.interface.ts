import { Types } from 'mongoose'
import { IBaseRepository } from './base.repository.interface'
import { ISKU } from '../../@types/models.type'

/**
 * SKU creation data transfer object
 */
export interface CreateSKUDTO {
  value: string
  price: number
  stock: number
  image?: string
  product: string | Types.ObjectId
  variant_values?: Record<string, string>
}

/**
 * SKU update data transfer object
 */
export interface UpdateSKUDTO {
  value?: string
  price?: number
  stock?: number
  image?: string
  variant_values?: Record<string, string>
}

/**
 * Result of a bulk atomic stock decrement operation
 */
export interface BulkDecrementResult {
  skuId: string | Types.ObjectId
  success: boolean
  sku?: ISKU | null
}

/**
 * SKU repository interface extending base repository
 */
export interface ISKURepository extends IBaseRepository<ISKU, CreateSKUDTO, UpdateSKUDTO> {
  /**
   * Find all SKUs for a product
   */
  findByProduct(productId: string | Types.ObjectId): Promise<ISKU[]>

  /**
   * Find a SKU by product and value (unique combination)
   */
  findByProductAndValue(productId: string | Types.ObjectId, value: string): Promise<ISKU | null>

  /**
   * Atomically decrement stock. Returns null if insufficient stock.
   * Uses findOneAndUpdate with { stock: { $gte: quantity } } condition.
   */
  atomicDecrementStock(skuId: string | Types.ObjectId, quantity: number): Promise<ISKU | null>

  /**
   * Atomically increment stock (e.g., on order cancellation)
   */
  atomicIncrementStock(skuId: string | Types.ObjectId, quantity: number): Promise<ISKU | null>

  /**
   * Bulk atomic decrement stock for multiple SKUs.
   * Throws BusinessError if any SKU fails (insufficient stock).
   */
  bulkAtomicDecrementStock(
    items: Array<{ skuId: string | Types.ObjectId; quantity: number }>
  ): Promise<BulkDecrementResult[]>

  /**
   * Find SKUs with stock below threshold
   */
  findLowStock(threshold: number): Promise<ISKU[]>
}

