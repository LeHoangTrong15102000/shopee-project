import { Types } from 'mongoose'
import {
  IWishlistRepository,
  IWishlistItem,
} from '@repositories/interfaces/wishlist.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import { HOST } from '@utils/helper'
import { ROUTE_IMAGE } from '@constants/config'

export class WishlistService extends BaseService {
  constructor(private readonly wishlistRepository: IWishlistRepository) {
    super()
  }

  /**
   * Transform product image URLs to full paths
   */
  private handleImageProduct<T extends { image?: string; images?: string[] }>(product: T): T {
    if (product.image !== undefined && product.image !== '') {
      product.image = HOST + `/${ROUTE_IMAGE}/` + product.image
    }
    if (product.images !== undefined && product.images.length !== 0) {
      product.images = product.images.map((image: string) =>
        image !== '' ? HOST + `/${ROUTE_IMAGE}/` + image : ''
      )
    }
    return product
  }

  /**
   * Transform wishlist items with product images
   */
  private transformWishlistItems(items: IWishlistItem[]): IWishlistItem[] {
    return items.map(item => ({
      ...item,
      product: item.product ? this.handleImageProduct(item.product) : null,
    }))
  }

  async getWishlist(userId: string, pagination: PaginationOptions): Promise<PaginatedResult<IWishlistItem>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const result = await this.wishlistRepository.findByUser(userId, this.normalizePagination(pagination))
    result.data = this.transformWishlistItems(result.data)
    return result
  }

  async addToWishlist(userId: string, productId: string): Promise<IWishlistItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const item = await this.wishlistRepository.addToWishlist(userId, productId)
    
    // Fetch with populated product
    const populated = await this.wishlistRepository.findById(item._id!)
    if (populated && populated.product) {
      populated.product = this.handleImageProduct(populated.product)
    }
    return populated || item
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const deleted = await this.wishlistRepository.removeFromWishlist(userId, productId)
    if (!deleted) {
      throw new NotFoundError('Wishlist item')
    }
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    return this.wishlistRepository.isInWishlist(userId, productId)
  }

  async clearWishlist(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.wishlistRepository.clearUserWishlist(userId)
  }

  async getWishlistCount(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.wishlistRepository.getUserWishlistCount(userId)
  }

  async checkProducts(userId: string, productIds: string[]): Promise<Map<string, boolean>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const invalidIds = productIds.filter(id => !this.isValidObjectId(id))
    if (invalidIds.length > 0) {
      throw new ValidationError('Invalid product ID format')
    }

    return this.wishlistRepository.checkProducts(userId, productIds)
  }
}

