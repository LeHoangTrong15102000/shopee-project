/// <reference types="jest" />

jest.mock('../../container', () => ({
  container: {
    services: {
      price: {
        getPriceHistory: jest.fn(),
        createPriceAlert: jest.fn(),
        getPriceAlerts: jest.fn(),
        deletePriceAlert: jest.fn(),
      },
    },
  },
}))

import { Request, Response } from 'express'
import { container } from '../../container'
import { getPriceHistory, createPriceAlert, getPriceAlerts, deletePriceAlert } from '@controllers/price.controller'

const mockPriceService = container.services.price as jest.Mocked<typeof container.services.price>

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  query: {},
  params: {},
  body: {},
  jwtDecoded: { id: 'user-123', email: 'test@test.com', roles: ['User'], created_at: '2024-01-01' },
  ...overrides,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('Price Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPriceHistory', () => {
    it('should return price history successfully with default days', async () => {
      const mockHistory = [
        { _id: 'ph1', product_id: 'product-123', price: 100000, price_before_discount: 120000, recorded_at: new Date('2024-01-01') },
        { _id: 'ph2', product_id: 'product-123', price: 95000, price_before_discount: 120000, recorded_at: new Date('2024-01-02') },
      ]
      mockPriceService.getPriceHistory.mockResolvedValue(mockHistory as any)

      const req = createMockRequest({ params: { productId: 'product-123' }, query: {} })
      const res = createMockResponse()

      await getPriceHistory(req as any, res as Response)

      expect(mockPriceService.getPriceHistory).toHaveBeenCalledWith('product-123', 30)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Lấy lịch sử giá thành công', data: mockHistory })
    })

    it('should return price history with custom days parameter', async () => {
      const mockHistory = [{ _id: 'ph1', product_id: 'product-123', price: 100000, price_before_discount: 120000, recorded_at: new Date('2024-01-01') }]
      mockPriceService.getPriceHistory.mockResolvedValue(mockHistory as any)

      const req = createMockRequest({ params: { productId: 'product-123' }, query: { days: '7' } })
      const res = createMockResponse()

      await getPriceHistory(req as any, res as Response)

      expect(mockPriceService.getPriceHistory).toHaveBeenCalledWith('product-123', 7)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('createPriceAlert', () => {
    it('should create price alert successfully', async () => {
      const mockAlert = {
        _id: 'alert-123',
        user_id: 'user-123',
        product_id: 'product-123',
        target_price: 90000,
        current_price: 100000,
        is_triggered: false,
        is_active: true,
        created_at: new Date(),
      }
      mockPriceService.createPriceAlert.mockResolvedValue(mockAlert as any)

      const req = createMockRequest({ body: { product_id: 'product-123', target_price: '90000' } })
      const res = createMockResponse()

      await createPriceAlert(req as any, res as Response)

      expect(mockPriceService.createPriceAlert).toHaveBeenCalledWith('user-123', 'product-123', 90000)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Tạo cảnh báo giá thành công', data: mockAlert })
    })
  })

  describe('getPriceAlerts', () => {
    it('should return price alerts successfully with default pagination', async () => {
      const mockResult = {
        data: [{
          _id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-123',
          target_price: 90000,
          current_price: 100000,
          is_triggered: false,
          is_active: true,
          created_at: new Date(),
        }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockPriceService.getPriceAlerts.mockResolvedValue(mockResult as any)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getPriceAlerts(req as any, res as Response)

      expect(mockPriceService.getPriceAlerts).toHaveBeenCalledWith(
        'user-123',
        { is_active: undefined, is_triggered: undefined },
        { page: 1, limit: 10 }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách cảnh báo giá thành công',
        data: { price_alerts: mockResult.data, pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } },
      })
    })

    it('should return price alerts with filter params', async () => {
      const mockResult = {
        data: [{
          _id: 'alert-1',
          user_id: 'user-123',
          product_id: 'product-123',
          target_price: 90000,
          current_price: 100000,
          is_triggered: false,
          is_active: true,
          created_at: new Date(),
        }],
        pagination: { page: 2, limit: 5, total: 10, page_size: 2 },
      }
      mockPriceService.getPriceAlerts.mockResolvedValue(mockResult as any)

      const req = createMockRequest({ query: { page: '2', limit: '5', is_active: 'true', is_triggered: 'false' } })
      const res = createMockResponse()

      await getPriceAlerts(req as any, res as Response)

      expect(mockPriceService.getPriceAlerts).toHaveBeenCalledWith(
        'user-123',
        { is_active: true, is_triggered: false },
        { page: 2, limit: 5 }
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('deletePriceAlert', () => {
    it('should delete price alert successfully', async () => {
      const mockDeletedAlert = {
        _id: 'alert-123',
        user_id: 'user-123',
        product_id: 'product-123',
        target_price: 90000,
        current_price: 100000,
        is_triggered: false,
        is_active: false,
        created_at: new Date(),
      }
      mockPriceService.deletePriceAlert.mockResolvedValue(mockDeletedAlert as any)

      const req = createMockRequest({ params: { alertId: 'alert-123' } })
      const res = createMockResponse()

      await deletePriceAlert(req as any, res as Response)

      expect(mockPriceService.deletePriceAlert).toHaveBeenCalledWith('user-123', 'alert-123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa cảnh báo giá thành công', data: mockDeletedAlert })
    })
  })
})

