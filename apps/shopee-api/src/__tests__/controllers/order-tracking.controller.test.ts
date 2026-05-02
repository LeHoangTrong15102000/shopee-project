/// <reference types="jest" />

jest.mock('../../container', () => ({
  orderService: {
    getTracking: jest.fn(),
    getTrackingByNumber: jest.fn(),
  },
}))

import { Request, Response } from 'express'
import { orderService } from '../../container'
import { getTracking, getTrackingByNumber } from '@controllers/order-tracking.controller'
import { ValidationError, NotFoundError } from '@services/base.service'

const mockOrderService = orderService as jest.Mocked<typeof orderService>

const createMockRequest = (overrides: Partial<Request> = {}): any => ({
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

describe('Order Tracking Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTracking', () => {
    it('should return tracking info successfully', async () => {
      const mockTracking = {
        _id: 'tracking-123',
        order_id: 'order-123',
        user_id: 'user-123',
        tracking_number: 'TRK123',
        carrier: 'ghn',
        status: 'shipping',
        estimated_delivery: new Date('2024-02-01'),
        timeline: [{ status: 'pending', description: 'Order created', timestamp: new Date() }],
        shipping_address: {
          name: 'John Doe',
          phone: '0123456789',
          address: '123 Main St',
          province: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockOrderService.getTracking.mockResolvedValue(mockTracking as any)

      const req = createMockRequest({ query: { order_id: 'order-123' } })
      const res = createMockResponse()

      await getTracking(req as any, res as Response)

      expect(mockOrderService.getTracking).toHaveBeenCalledWith('user-123', 'order-123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy thông tin tracking thành công',
        data: mockTracking,
      })
    })

    it('should return 400 when order_id is missing', async () => {
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getTracking(req as any, res as Response)

      expect(mockOrderService.getTracking).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'order_id là bắt buộc' })
    })

    it('should throw when NotFoundError is thrown', async () => {
      mockOrderService.getTracking.mockRejectedValue(new NotFoundError('Not found'))

      const req = createMockRequest({ query: { order_id: 'order-123' } })
      const res = createMockResponse()

      await expect(getTracking(req as any, res as any)).rejects.toThrow('Not found')
    })

    it('should throw when ValidationError is thrown', async () => {
      mockOrderService.getTracking.mockRejectedValue(new ValidationError('Invalid data'))

      const req = createMockRequest({ query: { order_id: 'order-123' } })
      const res = createMockResponse()

      await expect(getTracking(req as any, res as any)).rejects.toThrow('Invalid data')
    })

    it('should throw when generic error is thrown', async () => {
      mockOrderService.getTracking.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ query: { order_id: 'order-123' } })
      const res = createMockResponse()

      await expect(getTracking(req as any, res as any)).rejects.toThrow('Database error')
    })
  })

  describe('getTrackingByNumber', () => {
    it('should return tracking info successfully', async () => {
      const mockTracking = {
        _id: 'tracking-123',
        order_id: 'order-123',
        user_id: 'user-123',
        tracking_number: 'TRK123',
        carrier: 'ghn',
        status: 'shipping',
        estimated_delivery: new Date('2024-02-01'),
        timeline: [{ status: 'pending', description: 'Order created', timestamp: new Date() }],
        shipping_address: {
          name: 'John Doe',
          phone: '0123456789',
          address: '123 Main St',
          province: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockOrderService.getTrackingByNumber.mockResolvedValue(mockTracking as any)

      const req = createMockRequest({ params: { trackingNumber: 'TRK123' } })
      const res = createMockResponse()

      await getTrackingByNumber(req as any, res as Response)

      expect(mockOrderService.getTrackingByNumber).toHaveBeenCalledWith('TRK123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy thông tin tracking thành công',
        data: mockTracking,
      })
    })

    it('should throw when NotFoundError is thrown', async () => {
      mockOrderService.getTrackingByNumber.mockRejectedValue(new NotFoundError('Not found'))

      const req = createMockRequest({ params: { trackingNumber: 'TRK123' } })
      const res = createMockResponse()

      await expect(getTrackingByNumber(req as any, res as any)).rejects.toThrow('Not found')
    })

    it('should throw when ValidationError is thrown', async () => {
      mockOrderService.getTrackingByNumber.mockRejectedValue(
        new ValidationError('Invalid tracking number'),
      )

      const req = createMockRequest({ params: { trackingNumber: 'TRK123' } })
      const res = createMockResponse()

      await expect(getTrackingByNumber(req as any, res as any)).rejects.toThrow(
        'Invalid tracking number',
      )
    })

    it('should throw when generic error is thrown', async () => {
      mockOrderService.getTrackingByNumber.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { trackingNumber: 'TRK123' } })
      const res = createMockResponse()

      await expect(getTrackingByNumber(req as any, res as any)).rejects.toThrow('Database error')
    })
  })
})
