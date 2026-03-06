import { Types } from 'mongoose'
import { IBaseRepository } from './base.repository.interface'
import { ICategory } from '../../@types/models.type'

/**
 * Category creation data transfer object
 */
export interface CreateCategoryDTO {
  name: string
}

/**
 * Category update data transfer object
 */
export interface UpdateCategoryDTO {
  name?: string
}

/**
 * Category repository interface extending base repository
 */
export interface ICategoryRepository extends IBaseRepository<ICategory, CreateCategoryDTO, UpdateCategoryDTO> {
  /**
   * Find category by name
   */
  findByName(name: string): Promise<ICategory | null>

  /**
   * Check if category name exists
   */
  nameExists(name: string, excludeId?: string | Types.ObjectId): Promise<boolean>

  /**
   * Get all categories (typically small dataset, no pagination needed)
   */
  findAll(): Promise<ICategory[]>

  /**
   * Get categories with product count
   */
  findAllWithProductCount(): Promise<Array<ICategory & { productCount: number }>>

  /**
   * Search categories by name
   */
  searchByName(query: string): Promise<ICategory[]>
}

