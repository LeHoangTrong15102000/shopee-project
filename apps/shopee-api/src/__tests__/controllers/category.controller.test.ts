/**
 * Unit Tests cho Category Controller
 * Test các chức năng CRUD category
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import categoryController from '@controllers/category.controller'
import { STATUS } from '@constants/status'
import { NotFoundError, ValidationError, ConflictError } from '@services/base.service'

jest.mock('../../container', () => ({
  categoryService: {
    createCategory: jest.fn(),
    getCategories: jest.fn(),
    getCategoryById: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  },
}))

import { categoryService } from '../../container'

const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>

const createMockRequest = (
  options: { body?: any; params?: any; query?: any } = {},
): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockCategory = { _id: 'cat_1', name: 'Điện thoại' }

describe('Category Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addCategory', () => {
    it('should create category successfully', async () => {
      mockCategoryService.createCategory.mockResolvedValue(mockCategory as any)
      const req = createMockRequest({ body: { name: 'Điện thoại' } })
      const res = createMockResponse()

      await categoryController.addCategory(req as Request, res as Response)

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith({ name: 'Điện thoại' })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when category name already exists', async () => {
      mockCategoryService.createCategory.mockRejectedValue(
        new ConflictError('Category name already exists'),
      )
      const req = createMockRequest({ body: { name: 'Điện thoại' } })
      const res = createMockResponse()

      await expect(
        categoryController.addCategory(req as Request, res as Response),
      ).rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })
  })

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockCategoryService.getCategories.mockResolvedValue([mockCategory] as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await categoryController.getCategories(req as Request, res as Response)

      expect(mockCategoryService.getCategories).toHaveBeenCalledWith(undefined)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should pass exclude param', async () => {
      mockCategoryService.getCategories.mockResolvedValue([mockCategory] as any)
      const req = createMockRequest({ query: { exclude: 'cat_2' } })
      const res = createMockResponse()

      await categoryController.getCategories(req as Request, res as Response)

      expect(mockCategoryService.getCategories).toHaveBeenCalledWith('cat_2')
    })
  })

  describe('getCategory', () => {
    it('should return category by id', async () => {
      mockCategoryService.getCategoryById.mockResolvedValue(mockCategory as any)
      const req = createMockRequest({ params: { category_id: 'cat_1' } })
      const res = createMockResponse()

      await categoryController.getCategory(req as Request, res as Response)

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith('cat_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when category not found', async () => {
      mockCategoryService.getCategoryById.mockRejectedValue(
        new NotFoundError('Category', 'cat_999'),
      )
      const req = createMockRequest({ params: { category_id: 'cat_999' } })
      const res = createMockResponse()

      await expect(
        categoryController.getCategory(req as Request, res as Response),
      ).rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })
  })

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updated = { ...mockCategory, name: 'Laptop' }
      mockCategoryService.updateCategory.mockResolvedValue(updated as any)
      const req = createMockRequest({ params: { category_id: 'cat_1' }, body: { name: 'Laptop' } })
      const res = createMockResponse()

      await categoryController.updateCategory(req as Request, res as Response)

      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith('cat_1', { name: 'Laptop' })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when category not found', async () => {
      mockCategoryService.updateCategory.mockRejectedValue(new NotFoundError('Category', 'cat_999'))
      const req = createMockRequest({
        params: { category_id: 'cat_999' },
        body: { name: 'Laptop' },
      })
      const res = createMockResponse()

      await expect(
        categoryController.updateCategory(req as Request, res as Response),
      ).rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })

    it('should throw error when name conflicts', async () => {
      mockCategoryService.updateCategory.mockRejectedValue(
        new ConflictError('Category name already exists'),
      )
      const req = createMockRequest({
        params: { category_id: 'cat_1' },
        body: { name: 'Existing' },
      })
      const res = createMockResponse()

      await expect(
        categoryController.updateCategory(req as Request, res as Response),
      ).rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })
  })

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoryService.deleteCategory.mockResolvedValue(undefined)
      const req = createMockRequest({ params: { category_id: 'cat_1' } })
      const res = createMockResponse()

      await categoryController.deleteCategory(req as Request, res as Response)

      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('cat_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when category not found', async () => {
      mockCategoryService.deleteCategory.mockRejectedValue(new NotFoundError('Category', 'cat_999'))
      const req = createMockRequest({ params: { category_id: 'cat_999' } })
      const res = createMockResponse()

      await expect(
        categoryController.deleteCategory(req as Request, res as Response),
      ).rejects.toMatchObject({ status: STATUS.BAD_REQUEST })
    })
  })
})
