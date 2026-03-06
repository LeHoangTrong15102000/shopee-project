import { Types, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose'

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page: number
  limit: number
  sort?: Record<string, 1 | -1>
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    page_size: number
    total: number
  }
}

/**
 * Base repository interface defining common CRUD operations
 * All domain repositories should extend this interface
 */
export interface IBaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * Find a single document by ID
   */
  findById(id: string | Types.ObjectId): Promise<T | null>

  /**
   * Find a single document matching the filter
   */
  findOne(filter: FilterQuery<T>): Promise<T | null>

  /**
   * Find all documents matching the filter
   */
  find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]>

  /**
   * Find documents with pagination
   */
  findPaginated(
    filter: FilterQuery<T>,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>>

  /**
   * Create a new document
   */
  create(data: CreateDTO): Promise<T>

  /**
   * Update a document by ID
   */
  updateById(
    id: string | Types.ObjectId,
    data: UpdateDTO
  ): Promise<T | null>

  /**
   * Update documents matching the filter
   */
  updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<number>

  /**
   * Delete a document by ID
   */
  deleteById(id: string | Types.ObjectId): Promise<T | null>

  /**
   * Delete documents matching the filter
   */
  deleteMany(filter: FilterQuery<T>): Promise<number>

  /**
   * Count documents matching the filter
   */
  count(filter: FilterQuery<T>): Promise<number>

  /**
   * Check if a document exists
   */
  exists(filter: FilterQuery<T>): Promise<boolean>
}

