import { Types } from 'mongoose'
import { ICategory } from '../@types/models.type'
import {
  ICategoryRepository,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '@repositories/interfaces/category.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, ConflictError } from './base.service'
import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'

export class CategoryService extends BaseService {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super()
  }

  async createCategory(data: CreateCategoryDTO): Promise<ICategory> {
    if (data.name) {
      const nameExists = await this.categoryRepository.nameExists(data.name)
      if (nameExists) {
        throw new ConflictError('Category name already exists')
      }
    }

    const category = await this.categoryRepository.create(data)
    cacheService.del(CacheKeys.categoriesPattern())
    return category
  }

  async getCategories(excludeId?: string): Promise<ICategory[]> {
    const cacheKey = CacheKeys.categoriesList(excludeId)
    const cached = cacheService.get<ICategory[]>(cacheKey)
    if (cached) return cached

    let categories: ICategory[]
    if (excludeId) {
      categories = await this.categoryRepository.find({
        _id: { $ne: this.toObjectId(excludeId) },
      })
    } else {
      categories = await this.categoryRepository.findAll()
    }

    cacheService.set(cacheKey, categories, CacheTTL.CATEGORIES_LIST)
    return categories
  }

  async getCategoriesPaginated(pagination: PaginationOptions): Promise<PaginatedResult<ICategory>> {
    return this.categoryRepository.findPaginated({}, this.normalizePagination(pagination))
  }

  async getCategoryById(categoryId: string): Promise<ICategory> {
    if (!this.isValidObjectId(categoryId)) {
      throw new ValidationError('Invalid category ID format')
    }

    const category = await this.categoryRepository.findById(categoryId)
    if (!category) {
      throw new NotFoundError('Category', categoryId)
    }
    return category
  }

  async updateCategory(categoryId: string, data: UpdateCategoryDTO): Promise<ICategory> {
    if (!this.isValidObjectId(categoryId)) {
      throw new ValidationError('Invalid category ID format')
    }

    if (data.name) {
      const nameExists = await this.categoryRepository.nameExists(data.name, categoryId)
      if (nameExists) {
        throw new ConflictError('Category name already exists')
      }
    }

    const category = await this.categoryRepository.updateById(categoryId, data)
    if (!category) {
      throw new NotFoundError('Category', categoryId)
    }

    cacheService.del(CacheKeys.categoriesPattern())
    cacheService.del(CacheKeys.productsPattern())
    return category
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!this.isValidObjectId(categoryId)) {
      throw new ValidationError('Invalid category ID format')
    }

    const category = await this.categoryRepository.deleteById(categoryId)
    if (!category) {
      throw new NotFoundError('Category', categoryId)
    }

    cacheService.del(CacheKeys.categoriesPattern())
    cacheService.del(CacheKeys.productsPattern())
  }

  async getCategoriesWithProductCount(): Promise<Array<ICategory & { productCount: number }>> {
    return this.categoryRepository.findAllWithProductCount()
  }

  async searchCategories(query: string): Promise<ICategory[]> {
    return this.categoryRepository.searchByName(query)
  }
}
