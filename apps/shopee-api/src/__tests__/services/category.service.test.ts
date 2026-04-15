/**
 * Unit Tests for CategoryService
 * Tests category CRUD operations and business logic
 */

/// <reference types="jest" />
import { CategoryService } from '@services/category.service'
import { NotFoundError, ValidationError, ConflictError } from '@services/base.service'
import { ICategoryRepository } from '@repositories/interfaces/category.repository.interface'
import { Types } from 'mongoose'

// Mock cache service
jest.mock('@utils/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CacheKeys: {
    categoriesList: jest.fn(() => 'categories_list'),
    categoriesPattern: jest.fn(() => 'categories_*'),
    productsPattern: jest.fn(() => 'products_*'),
  },
  CacheTTL: {
    CATEGORIES_LIST: 600,
  },
}))

describe('CategoryService', () => {
  let categoryService: CategoryService
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>

  const validObjectId = new Types.ObjectId().toString()
  const mockCategory = {
    _id: new Types.ObjectId(validObjectId),
    name: 'Test Category',
  }

  beforeEach(() => {
    mockCategoryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findAll: jest.fn(),
      nameExists: jest.fn(),
      findAllWithProductCount: jest.fn(),
      searchByName: jest.fn(),
      findByName: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>

    categoryService = new CategoryService(mockCategoryRepository)
    jest.clearAllMocks()
  })

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      mockCategoryRepository.nameExists.mockResolvedValue(false)
      mockCategoryRepository.create.mockResolvedValue(mockCategory as any)

      const result = await categoryService.createCategory({ name: 'Test Category' })

      expect(mockCategoryRepository.nameExists).toHaveBeenCalledWith('Test Category')
      expect(mockCategoryRepository.create).toHaveBeenCalled()
      expect(result.name).toBe('Test Category')
    })

    it('should throw ConflictError if name already exists', async () => {
      mockCategoryRepository.nameExists.mockResolvedValue(true)

      await expect(categoryService.createCategory({ name: 'Existing Category' })).rejects.toThrow(
        ConflictError,
      )
    })
  })

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockCategoryRepository.findAll.mockResolvedValue([mockCategory] as any)

      const result = await categoryService.getCategories()

      expect(mockCategoryRepository.findAll).toHaveBeenCalled()
      expect(result.length).toBe(1)
    })

    it('should exclude category by id', async () => {
      mockCategoryRepository.find.mockResolvedValue([mockCategory] as any)

      const result = await categoryService.getCategories(validObjectId)

      expect(mockCategoryRepository.find).toHaveBeenCalled()
      expect(result.length).toBe(1)
    })
  })

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(mockCategory as any)

      const result = await categoryService.getCategoryById(validObjectId)

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(validObjectId)
      expect(result.name).toBe('Test Category')
    })

    it('should throw NotFoundError when category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null)

      await expect(categoryService.getCategoryById(validObjectId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(categoryService.getCategoryById('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      mockCategoryRepository.nameExists.mockResolvedValue(false)
      mockCategoryRepository.updateById.mockResolvedValue({
        ...mockCategory,
        name: 'Updated',
      } as any)

      const result = await categoryService.updateCategory(validObjectId, { name: 'Updated' })

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(validObjectId, {
        name: 'Updated',
      })
      expect(result.name).toBe('Updated')
    })

    it('should throw ConflictError if name already exists', async () => {
      mockCategoryRepository.nameExists.mockResolvedValue(true)

      await expect(
        categoryService.updateCategory(validObjectId, { name: 'Existing' }),
      ).rejects.toThrow(ConflictError)
    })

    it('should throw NotFoundError when category not found', async () => {
      mockCategoryRepository.nameExists.mockResolvedValue(false)
      mockCategoryRepository.updateById.mockResolvedValue(null)

      await expect(
        categoryService.updateCategory(validObjectId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoryRepository.deleteById.mockResolvedValue(mockCategory as any)

      await categoryService.deleteCategory(validObjectId)

      expect(mockCategoryRepository.deleteById).toHaveBeenCalledWith(validObjectId)
    })

    it('should throw NotFoundError when category not found', async () => {
      mockCategoryRepository.deleteById.mockResolvedValue(null)

      await expect(categoryService.deleteCategory(validObjectId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('getCategoriesWithProductCount', () => {
    it('should return categories with product count', async () => {
      const categoriesWithCount = [{ ...mockCategory, productCount: 5 }]
      mockCategoryRepository.findAllWithProductCount.mockResolvedValue(categoriesWithCount as any)

      const result = await categoryService.getCategoriesWithProductCount()

      expect(mockCategoryRepository.findAllWithProductCount).toHaveBeenCalled()
      expect(result[0].productCount).toBe(5)
    })
  })
})
