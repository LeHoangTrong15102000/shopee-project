import { describe, it, expect, vi, beforeEach } from 'vitest'
import categoriesApi from './categories.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('categories.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCategories calls GET /admin/categories with params', () => {
    categoriesApi.getCategories({ page: 1, limit: 10 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/categories', {
      params: { page: 1, limit: 10 },
    })
  })

  it('getCategory calls GET /admin/categories/:id', () => {
    categoriesApi.getCategory('cat-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/categories/cat-1')
  })

  it('createCategory calls POST /admin/categories', () => {
    categoriesApi.createCategory({ name: 'Electronics' })
    expect(mockHttp.post).toHaveBeenCalledWith('admin/categories', { name: 'Electronics' })
  })

  it('updateCategory calls PUT /admin/categories/:id', () => {
    categoriesApi.updateCategory('cat-1', { name: 'Updated' })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/categories/cat-1', { name: 'Updated' })
  })

  it('deleteCategory calls DELETE /admin/categories/delete/:id', () => {
    categoriesApi.deleteCategory('cat-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/categories/delete/cat-1')
  })
})
