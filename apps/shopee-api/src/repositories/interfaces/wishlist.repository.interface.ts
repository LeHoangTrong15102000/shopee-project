import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'

/**
 * Wishlist item interface
 */
export interface IWishlistItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  product: Types.ObjectId | any // populated product
  addedAt: Date
}

/**
 * Wishlist creation DTO
 */
export interface CreateWishlistDTO {
  user: Types.ObjectId | string
  product: Types.ObjectId | string
}

/**
 * Wishlist repository interface
 */
export interface IWishlistRepository extends IBaseRepository<
  IWishlistItem,
  CreateWishlistDTO,
  Partial<IWishlistItem>
> {
  /**
   * Find user's wishlist with populated products
   */
  findByUser(
    userId: string | Types.ObjectId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IWishlistItem>>

  /**
   * Check if product is in user's wishlist
   */
  isInWishlist(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
  ): Promise<boolean>

  /**
   * Add product to wishlist (returns existing if already added)
   */
  addToWishlist(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
  ): Promise<IWishlistItem>

  /**
   * Remove product from wishlist
   */
  removeFromWishlist(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
  ): Promise<IWishlistItem | null>

  /**
   * Clear all items from user's wishlist
   */
  clearUserWishlist(userId: string | Types.ObjectId): Promise<number>

  /**
   * Get count of items in user's wishlist
   */
  getUserWishlistCount(userId: string | Types.ObjectId): Promise<number>

  /**
   * Check multiple products in wishlist
   */
  checkProducts(
    userId: string | Types.ObjectId,
    productIds: (string | Types.ObjectId)[],
  ): Promise<Map<string, boolean>>
}
