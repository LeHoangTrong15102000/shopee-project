import { describe, it, expect, vi, beforeEach } from 'vitest'
import productsApi from './products.api'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import http from 'src/utils/http'

const mockHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('products.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getProducts calls GET /admin/products with params', () => {
    const params = { page: 1, limit: 10, category: 'cat-1' }
    productsApi.getProducts(params)
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products', { params })
  })

  it('getProducts works without params', () => {
    productsApi.getProducts()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products', { params: undefined })
  })

  it('getAllProducts calls GET /admin/products/all', () => {
    productsApi.getAllProducts({ category: 'cat-1' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/all', {
      params: { category: 'cat-1' },
    })
  })

  it('getProduct calls GET /admin/products/:id', () => {
    productsApi.getProduct('prod-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/prod-1')
  })

  it('createProduct calls POST /admin/products', () => {
    const body = { name: 'Test', price: 100, quantity: 10, category: 'cat-1', image: 'img.jpg' }
    productsApi.createProduct(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/products', body)
  })

  it('updateProduct calls PUT /admin/products/:id', () => {
    productsApi.updateProduct('prod-1', { name: 'Updated' })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/products/prod-1', { name: 'Updated' })
  })

  it('deleteProduct calls DELETE /admin/products/delete/:id', () => {
    productsApi.deleteProduct('prod-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/products/delete/prod-1')
  })

  it('deleteManyProducts calls DELETE /admin/products/delete-many with list_id', () => {
    productsApi.deleteManyProducts(['id-1', 'id-2'])
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/products/delete-many', {
      data: { list_id: ['id-1', 'id-2'] },
    })
  })

  it('uploadImage calls POST with multipart/form-data header', () => {
    const formData = new FormData()
    productsApi.uploadImage(formData)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('uploadImages calls POST with multipart/form-data header', () => {
    const formData = new FormData()
    productsApi.uploadImages(formData)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/products/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })
})
