/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  productService: {
    getLowStockProducts: jest.fn(),
    getOutOfStockProducts: jest.fn(),
    updateStock: jest.fn(),
    bulkUpdateStock: jest.fn(),
  },
}))

import { productService } from '../../container'
import {
  adminGetLowStock,
  adminGetOutOfStock,
  adminUpdateStock,
  adminBulkUpdateStock,
} from '../../controllers/admin-inventory.controller'
import { ValidationError, NotFoundError } from '@services/base.service'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Admin Inventory Controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adminGetLowStock with default threshold', async () => {
    ;(productService.getLowStockProducts as jest.Mock).mockResolvedValue([])
    const req = createMockRequest({ query: { page: '2', limit: '10' } })
    const res = createMockResponse()
    await adminGetLowStock(req as Request, res as Response)
    // Controller: Number(threshold) || 10, { page: Number(page) || 1, limit: Number(limit) || 20 }
    expect(productService.getLowStockProducts).toHaveBeenCalledWith(10, { page: 2, limit: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetLowStock with custom threshold', async () => {
    ;(productService.getLowStockProducts as jest.Mock).mockResolvedValue([])
    const req = createMockRequest({ query: { threshold: '5' } })
    const res = createMockResponse()
    await adminGetLowStock(req as Request, res as Response)
    expect(productService.getLowStockProducts).toHaveBeenCalledWith(5, { page: 1, limit: 20 })
  })

  it('adminGetOutOfStock', async () => {
    ;(productService.getOutOfStockProducts as jest.Mock).mockResolvedValue([])
    const req = createMockRequest({ query: { page: '1', limit: '10' } })
    const res = createMockResponse()
    await adminGetOutOfStock(req as Request, res as Response)
    expect(productService.getOutOfStockProducts).toHaveBeenCalledWith({ page: 1, limit: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminUpdateStock success', async () => {
    ;(productService.updateStock as jest.Mock).mockResolvedValue({ stock: 20 })
    const req = createMockRequest({ params: { product_id: 'p1' }, body: { quantity: 20 } })
    const res = createMockResponse()
    await adminUpdateStock(req as Request, res as Response)
    expect(productService.updateStock).toHaveBeenCalledWith('p1', 20)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminUpdateStock throws on ValidationError', async () => {
    ;(productService.updateStock as jest.Mock).mockRejectedValue(new ValidationError('Invalid'))
    const req = createMockRequest({ params: { product_id: 'p1' }, body: { quantity: -1 } })
    const res = createMockResponse()
    await expect(adminUpdateStock(req as Request, res as Response)).rejects.toThrow()
  })

  it('adminUpdateStock throws on NotFoundError', async () => {
    ;(productService.updateStock as jest.Mock).mockRejectedValue(new NotFoundError('Product'))
    const req = createMockRequest({ params: { product_id: 'x' }, body: { quantity: 1 } })
    const res = createMockResponse()
    await expect(adminUpdateStock(req as Request, res as Response)).rejects.toThrow()
  })

  it('adminBulkUpdateStock', async () => {
    ;(productService.bulkUpdateStock as jest.Mock).mockResolvedValue({ updated: 2 })
    const items = [{ product_id: 'p1', quantity: 10 }]
    const req = createMockRequest({ body: { items } })
    const res = createMockResponse()
    await adminBulkUpdateStock(req as Request, res as Response)
    expect(productService.bulkUpdateStock).toHaveBeenCalledWith(items)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
