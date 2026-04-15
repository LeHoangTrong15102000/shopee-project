import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'
import { IPurchase } from '../../@types/models.type'
import { STATUS_PURCHASE, StatusPurchaseType } from '@constants/purchase'

// Re-export for backward compatibility
export { STATUS_PURCHASE }
export type PurchaseStatus = StatusPurchaseType

// Alias constant for backward compatibility with enum-style usage
export const PurchaseStatus = STATUS_PURCHASE

/**
 * Purchase creation data transfer object
 */
export interface CreatePurchaseDTO {
  user: string | Types.ObjectId
  product: string | Types.ObjectId
  buy_count: number
  price: number
  price_before_discount: number
  status: PurchaseStatus
  sku?: string | Types.ObjectId
}

/**
 * Purchase update data transfer object
 */
export interface UpdatePurchaseDTO {
  buy_count?: number
  price?: number
  price_before_discount?: number
  status?: PurchaseStatus
  sku?: string | Types.ObjectId
}

/**
 * Purchase filter options
 */
export interface PurchaseFilterOptions {
  user?: string | Types.ObjectId
  product?: string | Types.ObjectId
  status?: PurchaseStatus | PurchaseStatus[]
}

/**
 * Purchase repository interface extending base repository
 */
export interface IPurchaseRepository extends IBaseRepository<
  IPurchase,
  CreatePurchaseDTO,
  UpdatePurchaseDTO
> {
  /**
   * Find purchases by user
   */
  findByUser(
    userId: string | Types.ObjectId,
    status?: PurchaseStatus,
    pagination?: PaginationOptions,
  ): Promise<IPurchase[]>

  /**
   * Find user's cart items
   */
  findCart(userId: string | Types.ObjectId): Promise<IPurchase[]>

  /**
   * Add item to cart (or update if exists)
   */
  addToCart(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    buyCount: number,
    price: number,
    priceBeforeDiscount: number,
    skuId?: string | Types.ObjectId,
  ): Promise<IPurchase>

  /**
   * Update cart item quantity
   */
  updateCartItem(
    purchaseId: string | Types.ObjectId,
    buyCount: number,
    skuId?: string | Types.ObjectId,
    price?: number,
  ): Promise<IPurchase | null>

  /**
   * Remove item from cart
   */
  removeFromCart(purchaseId: string | Types.ObjectId): Promise<boolean>

  /**
   * Clear user's cart
   */
  clearCart(userId: string | Types.ObjectId): Promise<number>

  /**
   * Update purchase status
   */
  updateStatus(
    purchaseId: string | Types.ObjectId,
    status: PurchaseStatus,
  ): Promise<IPurchase | null>

  /**
   * Bulk update purchase status
   */
  bulkUpdateStatus(
    purchaseIds: Array<string | Types.ObjectId>,
    status: PurchaseStatus,
  ): Promise<number>

  /**
   * Find purchases by status
   */
  findByStatus(
    status: PurchaseStatus,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPurchase>>

  /**
   * Get purchase statistics for a user
   */
  getUserStats(userId: string | Types.ObjectId): Promise<{
    total_orders: number
    total_spent: number
    orders_by_status: Record<PurchaseStatus, number>
  }>

  /**
   * Find existing cart item for product
   */
  findCartItem(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
  ): Promise<IPurchase | null>

  /**
   * Find purchase by ID and user
   */
  findByIdAndUser(
    purchaseId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IPurchase | null>

  /**
   * Delete purchases by user and product with specific status
   */
  deleteByUserAndProduct(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    status: PurchaseStatus,
  ): Promise<number>
}
