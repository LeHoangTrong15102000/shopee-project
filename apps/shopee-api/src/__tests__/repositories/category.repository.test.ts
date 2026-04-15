/// <reference types="jest" />

const mockCategoryData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Electronics',
  toObject: () => mockCategoryData,
}

jest.mock('@database/models/category.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ toObject: () => mockCategoryData }),
  }))
  mockModel.findById = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOne = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
      lean: jest.fn(),
    }),
    lean: jest.fn(),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  mockModel.aggregate = jest.fn()
  return { CategoryModel: mockModel }
})

jest.mock('@database/models/product.model', () => ({
  ProductModel: {},
}))

import { CategoryModel } from '@database/models/category.model'
import { CategoryRepository } from '../../repositories/category.repository'

describe('CategoryRepository', () => {
  let repository: CategoryRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new CategoryRepository()
  })

  describe('findById', () => {
    it('should find category by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCategoryData)
      ;(CategoryModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(CategoryModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockCategoryData)
    })

    it('should return null if category not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(CategoryModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findOne', () => {
    it('should find one category with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCategoryData)
      ;(CategoryModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findOne({ name: 'Electronics' })

      expect(CategoryModel.findOne).toHaveBeenCalledWith({ name: 'Electronics' })
      expect(result).toEqual(mockCategoryData)
    })
  })

  describe('find', () => {
    it('should find categories with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockCategoryData])
      ;(CategoryModel.find as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.find({})

      expect(CategoryModel.find).toHaveBeenCalledWith({}, null, undefined)
      expect(result).toEqual([mockCategoryData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockCategoryData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(CategoryModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(CategoryModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockCategoryData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new category', async () => {
      const result = await repository.create({ name: 'New Category' })
      expect(result).toEqual(mockCategoryData)
    })
  })

  describe('updateById', () => {
    it('should update category by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCategoryData)
      ;(CategoryModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { name: 'Updated' })

      expect(CategoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { name: 'Updated' },
        { new: true },
      )
      expect(result).toEqual(mockCategoryData)
    })
  })

  describe('deleteById', () => {
    it('should delete category by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCategoryData)
      ;(CategoryModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockCategoryData)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(CategoryModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({})
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(CategoryModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.exists({ name: 'Electronics' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(CategoryModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ name: 'Nonexistent' })
      expect(result).toBe(false)
    })
  })

  describe('findByName', () => {
    it('should find category by name', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCategoryData)
      ;(CategoryModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findByName('Electronics')

      expect(CategoryModel.findOne).toHaveBeenCalledWith({ name: 'Electronics' })
      expect(result).toEqual(mockCategoryData)
    })

    it('should return null if category not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(CategoryModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findByName('Nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('nameExists', () => {
    it('should return true if name exists', async () => {
      ;(CategoryModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })

      const result = await repository.nameExists('Electronics')

      expect(CategoryModel.exists).toHaveBeenCalledWith({ name: 'Electronics' })
      expect(result).toBe(true)
    })

    it('should return false if name does not exist', async () => {
      ;(CategoryModel.exists as jest.Mock).mockResolvedValue(null)

      const result = await repository.nameExists('Nonexistent')

      expect(result).toBe(false)
    })

    it('should exclude specific id when checking name exists', async () => {
      ;(CategoryModel.exists as jest.Mock).mockResolvedValue(null)

      const result = await repository.nameExists('Electronics', '507f1f77bcf86cd799439011')

      expect(CategoryModel.exists).toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('findAll', () => {
    it('should find all categories sorted by name', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockCategoryData])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(CategoryModel.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const result = await repository.findAll()

      expect(CategoryModel.find).toHaveBeenCalledWith({})
      expect(mockSort).toHaveBeenCalledWith({ name: 1 })
      expect(result).toEqual([mockCategoryData])
    })
  })

  describe('findAllWithProductCount', () => {
    it('should find all categories with product count', async () => {
      const categoriesWithCount = [{ ...mockCategoryData, productCount: 10 }]
      ;(CategoryModel.aggregate as jest.Mock).mockResolvedValue(categoriesWithCount)

      const result = await repository.findAllWithProductCount()

      expect(CategoryModel.aggregate).toHaveBeenCalled()
      expect(result).toEqual(categoriesWithCount)
      expect(result[0].productCount).toBe(10)
    })
  })

  describe('searchByName', () => {
    it('should search categories by name', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockCategoryData])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(CategoryModel.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const result = await repository.searchByName('Elec')

      expect(CategoryModel.find).toHaveBeenCalled()
      expect(result).toEqual([mockCategoryData])
    })

    it('should return empty array if no matches', async () => {
      const mockLean = jest.fn().mockResolvedValue([])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(CategoryModel.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const result = await repository.searchByName('xyz')

      expect(result).toEqual([])
    })
  })
})
