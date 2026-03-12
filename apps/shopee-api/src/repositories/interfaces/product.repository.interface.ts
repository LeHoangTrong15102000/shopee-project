import { Types, FilterQuery } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'
import { IProduct } from '../../@types/models.type'

/**
 * Product filter options for querying products
 */
export interface ProductFilterOptions {
  category?: string | Types.ObjectId
  name?: string | RegExp
  price_min?: number
  price_max?: number
  rating_filter?: number
  exclude?: string | Types.ObjectId
  location?: string
}

/**
 * Product sort options
 */
export interface ProductSortOptions {
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
}

/**
 * Product creation data transfer object
 */
export interface CreateProductDTO {
  name: string
  image: string
  images: string[]
  description?: string
  category: string | Types.ObjectId
  price: number
  price_before_discount: number
  quantity: number
  location?: string
  variants?: Array<{ type: string; name: string; options: Array<{ name: string; value: string; image?: string }> }>
}

/**
 * Product update data transfer object
 */
export interface UpdateProductDTO {
  name?: string
  image?: string
  images?: string[]
  description?: string
  category?: string | Types.ObjectId
  price?: number
  price_before_discount?: number
  quantity?: number
  rating?: number
  sold?: number
  view?: number
  location?: string
  variants?: Array<{ type: string; name: string; options: Array<{ name: string; value: string; image?: string }> }>
}

/**
 * Product repository interface extending base repository
 */
export interface IProductRepository extends IBaseRepository<IProduct, CreateProductDTO, UpdateProductDTO> {
  /**
   * Find products with filters, sorting, and pagination
   */
  findProducts(
    filters: ProductFilterOptions,
    sort: ProductSortOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProduct>>

  /**
   * Find products by category
   */
  findByCategory(
    categoryId: string | Types.ObjectId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProduct>>

  /**
   * Search products by name (text search)
   */
  searchByName(
    query: string,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProduct>>

  /**
   * Increment product view count
   */
  incrementView(productId: string | Types.ObjectId): Promise<void>

  /**
   * Update product sold count
   */
  incrementSold(productId: string | Types.ObjectId, count: number): Promise<void>

  /**
   * Update product quantity (decrease after purchase)
   */
  decrementQuantity(productId: string | Types.ObjectId, count: number): Promise<void>

  /**
   * Find products with low stock
   */
  findLowStock(threshold: number): Promise<IProduct[]>

  /**
   * Bulk update products
   */
  bulkUpdate(
    updates: Array<{ id: string | Types.ObjectId; data: UpdateProductDTO }>
  ): Promise<number>

  /**
   * Bulk update product stock (quantity and sold) using $inc operations
   */
  bulkUpdateStock(
    updates: Array<{ product_id: string | Types.ObjectId; quantity_change: number; sold_change: number }>
  ): Promise<number>

  /**
   * Update product rating
   */
  updateRating(productId: string | Types.ObjectId, rating: number): Promise<void>

  /**
   * Find products with low stock (paginated)
   */
  findLowStockPaginated(
    threshold: number,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProduct>>

  /**
   * Find out of stock products
   */
  findOutOfStock(pagination: PaginationOptions): Promise<PaginatedResult<IProduct>>
}

