/**
 * Unit Tests cho Order Controller
 * Test các chức năng đặt hàng, xem đơn, hủy đơn, xác nhận nhận hàng
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

jest.mock('../../container', () => ({
  orderService: {
    getShippingMethods: jest.fn(),
    getPaymentMethods: jest.fn(),
    createOrder: jest.fn(),
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    confirmReceived: jest.fn(),
    returnOrder: jest.fn(),
    adminUpdateStatus: jest.fn(),
    adminGetOrder: jest.fn(),
    adminGetOrders: jest.fn(),
    adminBulkUpdateStatus: jest.fn(),
    adminGetOrderCountByStatus: jest.fn(),
  },
}))

import { orderService } from '../../container'
import {
  getShippingMethods,
  getPaymentMethods,
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmReceived,
  returnOrder,
  adminUpdateStatus,
  adminGetOrder,
  adminGetOrders,
  adminBulkUpdateStatus,
  adminGetOrderCountByStatus,
} from '@controllers/order.controller'

const mockOrderService = orderService as jest.Mocked<typeof orderService>

const createMockRequest = (
  options: { body?: any; params?: any; query?: any; jwtDecoded?: any } = {},
): any => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded || {
    id: 'user_1',
    email: 'test@example.com',
    roles: ['User'],
    created_at: new Date().toISOString(),
  },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockOrder = {
  _id: 'order_1',
  user: 'user_1',
  items: [{ product_id: 'p1', buy_count: 2, price: 100000 }],
  total_amount: 200000,
  status: 'pending',
}

describe('Order Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getShippingMethods', () => {
    it('should return shipping methods', async () => {
      const methods = [{ id: 'standard', name: 'Giao hàng tiêu chuẩn', price: 30000 }]
      mockOrderService.getShippingMethods.mockReturnValue(methods as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getShippingMethods(req as any, res as Response)

      expect(mockOrderService.getShippingMethods).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  describe('getPaymentMethods', () => {
    it('should return payment methods', async () => {
      const methods = [{ id: 'cod', name: 'Thanh toán khi nhận hàng' }]
      mockOrderService.getPaymentMethods.mockReturnValue(methods as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getPaymentMethods(req as any, res as Response)

      expect(mockOrderService.getPaymentMethods).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      mockOrderService.createOrder.mockResolvedValue(mockOrder as any)
      const req = createMockRequest({
        body: {
          items: [{ product_id: 'p1', buy_count: 2 }],
          shipping_address_id: 'addr_1',
          shipping_method_id: 'standard',
          payment_method: 'cod',
        },
      })
      const res = createMockResponse()

      await createOrder(req as any, res as Response)

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        'user_1',
        expect.objectContaining({
          items: [{ product_id: 'p1', buy_count: 2 }],
          shipping_address_id: 'addr_1',
        }),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.createOrder.mockRejectedValue(new ValidationError('Items không hợp lệ'))
      const req = createMockRequest({ body: { items: [] } })
      const res = createMockResponse()

      await expect(createOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockOrderService.createOrder.mockRejectedValue(new BusinessError('Sản phẩm hết hàng'))
      const req = createMockRequest({ body: { items: [{ product_id: 'p1', buy_count: 1 }] } })
      const res = createMockResponse()

      await expect(createOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw NOT_FOUND on NotFoundError', async () => {
      mockOrderService.createOrder.mockRejectedValue(new NotFoundError('Address', 'addr_999'))
      const req = createMockRequest({
        body: { items: [{ product_id: 'p1', buy_count: 1 }], shipping_address_id: 'addr_999' },
      })
      const res = createMockResponse()

      await expect(createOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })
  })

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const result = {
        data: [mockOrder],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockOrderService.getOrders.mockResolvedValue(result as any)
      const req = createMockRequest({ query: { page: '1', limit: '10' } })
      const res = createMockResponse()

      await getOrders(req as any, res as Response)

      expect(mockOrderService.getOrders).toHaveBeenCalledWith('user_1', undefined, {
        page: 1,
        limit: 10,
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should filter by status', async () => {
      const result = {
        data: [mockOrder],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockOrderService.getOrders.mockResolvedValue(result as any)
      const req = createMockRequest({ query: { status: 'pending', page: '1', limit: '10' } })
      const res = createMockResponse()

      await getOrders(req as any, res as Response)

      expect(mockOrderService.getOrders).toHaveBeenCalledWith('user_1', 'pending', {
        page: 1,
        limit: 10,
      })
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.getOrders.mockRejectedValue(new ValidationError('Invalid status'))
      const req = createMockRequest({ query: { status: 'invalid' } })
      const res = createMockResponse()

      await expect(getOrders(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      mockOrderService.getOrderById.mockResolvedValue(mockOrder as any)
      const req = createMockRequest({ params: { id: 'order_1' } })
      const res = createMockResponse()

      await getOrderById(req as any, res as Response)

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('user_1', 'order_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.getOrderById.mockRejectedValue(new NotFoundError('Order', 'order_999'))
      const req = createMockRequest({ params: { id: 'order_999' } })
      const res = createMockResponse()

      await expect(getOrderById(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.getOrderById.mockRejectedValue(new ValidationError('Invalid order id'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await expect(getOrderById(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const cancelled = { ...mockOrder, status: 'cancelled' }
      mockOrderService.cancelOrder.mockResolvedValue(cancelled as any)
      const req = createMockRequest({ params: { id: 'order_1' }, body: { reason: 'Đổi ý' } })
      const res = createMockResponse()

      await cancelOrder(req as any, res as Response)

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('user_1', 'order_1', 'Đổi ý')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockOrderService.cancelOrder.mockRejectedValue(
        new BusinessError('Đơn hàng đã giao không thể hủy'),
      )
      const req = createMockRequest({ params: { id: 'order_1' }, body: { reason: 'test' } })
      const res = createMockResponse()

      await expect(cancelOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.cancelOrder.mockRejectedValue(new NotFoundError('Order', 'order_999'))
      const req = createMockRequest({ params: { id: 'order_999' }, body: { reason: 'test' } })
      const res = createMockResponse()

      await expect(cancelOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })
  })

  describe('confirmReceived', () => {
    it('should confirm received successfully', async () => {
      const received = { ...mockOrder, status: 'delivered' }
      mockOrderService.confirmReceived.mockResolvedValue(received as any)
      const req = createMockRequest({ params: { id: 'order_1' } })
      const res = createMockResponse()

      await confirmReceived(req as any, res as Response)

      expect(mockOrderService.confirmReceived).toHaveBeenCalledWith('user_1', 'order_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockOrderService.confirmReceived.mockRejectedValue(
        new BusinessError('Đơn hàng chưa được giao'),
      )
      const req = createMockRequest({ params: { id: 'order_1' } })
      const res = createMockResponse()

      await expect(confirmReceived(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.confirmReceived.mockRejectedValue(new NotFoundError('Order', 'order_999'))
      const req = createMockRequest({ params: { id: 'order_999' } })
      const res = createMockResponse()

      await expect(confirmReceived(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.confirmReceived.mockRejectedValue(new ValidationError('Invalid state'))
      const req = createMockRequest({ params: { id: 'order_1' } })
      const res = createMockResponse()

      await expect(confirmReceived(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('returnOrder', () => {
    it('should return order successfully', async () => {
      const returned = { ...mockOrder, status: 'return_requested' }
      mockOrderService.returnOrder.mockResolvedValue(returned as any)
      const req = createMockRequest({ params: { id: 'order_1' }, body: { reason: 'Hàng lỗi' } })
      const res = createMockResponse()

      await returnOrder(req as any, res as Response)

      expect(mockOrderService.returnOrder).toHaveBeenCalledWith('user_1', 'order_1', 'Hàng lỗi')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockOrderService.returnOrder.mockRejectedValue(new BusinessError('Không thể trả hàng'))
      const req = createMockRequest({ params: { id: 'order_1' }, body: { reason: 'test' } })
      const res = createMockResponse()

      await expect(returnOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.returnOrder.mockRejectedValue(new NotFoundError('Order', 'order_999'))
      const req = createMockRequest({ params: { id: 'order_999' }, body: { reason: 'test' } })
      const res = createMockResponse()

      await expect(returnOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should rethrow generic errors', async () => {
      mockOrderService.returnOrder.mockRejectedValue(new Error('DB error'))
      const req = createMockRequest({ params: { id: 'order_1' }, body: { reason: 'test' } })
      const res = createMockResponse()

      await expect(returnOrder(req as any, res as Response)).rejects.toThrow('DB error')
    })
  })

  describe('adminUpdateStatus', () => {
    it('should update order status successfully', async () => {
      const updated = { ...mockOrder, status: 'shipped' }
      mockOrderService.adminUpdateStatus.mockResolvedValue(updated as any)
      const req = createMockRequest({
        params: { id: 'order_1' },
        body: { status: 'shipped', reason: 'Đã giao hàng' },
      })
      const res = createMockResponse()

      await adminUpdateStatus(req as any, res as Response)

      expect(mockOrderService.adminUpdateStatus).toHaveBeenCalledWith('order_1', 'shipped', {
        reason: 'Đã giao hàng',
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.adminUpdateStatus.mockRejectedValue(new ValidationError('Invalid status'))
      const req = createMockRequest({
        params: { id: 'order_1' },
        body: { status: 'invalid' },
      })
      const res = createMockResponse()

      await expect(adminUpdateStatus(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.adminUpdateStatus.mockRejectedValue(new NotFoundError('Order', 'o1'))
      const req = createMockRequest({ params: { id: 'o1' }, body: { status: 'shipped' } })
      const res = createMockResponse()

      await expect(adminUpdateStatus(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })
  })

  describe('adminGetOrder', () => {
    it('should get order by id as admin', async () => {
      mockOrderService.adminGetOrder.mockResolvedValue(mockOrder as any)
      const req = createMockRequest({ params: { id: 'order_1' } })
      const res = createMockResponse()

      await adminGetOrder(req as any, res as Response)

      expect(mockOrderService.adminGetOrder).toHaveBeenCalledWith('order_1')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw NOT_FOUND when order not found', async () => {
      mockOrderService.adminGetOrder.mockRejectedValue(new NotFoundError('Order', 'o999'))
      const req = createMockRequest({ params: { id: 'o999' } })
      const res = createMockResponse()

      await expect(adminGetOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.adminGetOrder.mockRejectedValue(new ValidationError('Invalid id'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await expect(adminGetOrder(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })
  })

  describe('adminGetOrders', () => {
    it('should return admin orders list', async () => {
      const mockAdminResult = {
        data: [mockOrder],
        pagination: { page: 1, limit: 20, total: 1, page_size: 1 },
      }
      mockOrderService.adminGetOrders.mockResolvedValue(mockAdminResult as any)
      const req = createMockRequest({
        query: { page: '1', limit: '20', status: 'pending' },
      })
      const res = createMockResponse()

      await adminGetOrders(req as any, res as Response)

      expect(mockOrderService.adminGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
        expect.objectContaining({ page: 1, limit: 20 }),
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should use default pagination values', async () => {
      const mockAdminResult = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, page_size: 0 },
      }
      mockOrderService.adminGetOrders.mockResolvedValue(mockAdminResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await adminGetOrders(req as any, res as Response)

      expect(mockOrderService.adminGetOrders).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })
  })

  describe('adminBulkUpdateStatus', () => {
    it('should bulk update order statuses', async () => {
      const bulkResult = { updated: 3, failed: 0 }
      mockOrderService.adminBulkUpdateStatus.mockResolvedValue(bulkResult as any)
      const req = createMockRequest({
        body: { order_ids: ['o1', 'o2', 'o3'], status: 'shipped', reason: 'Batch update' },
      })
      const res = createMockResponse()

      await adminBulkUpdateStatus(req as any, res as Response)

      expect(mockOrderService.adminBulkUpdateStatus).toHaveBeenCalledWith(
        ['o1', 'o2', 'o3'],
        'shipped',
        'Batch update',
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw BAD_REQUEST on ValidationError', async () => {
      mockOrderService.adminBulkUpdateStatus.mockRejectedValue(
        new ValidationError('Invalid status'),
      )
      const req = createMockRequest({ body: { order_ids: ['o1'], status: 'invalid' } })
      const res = createMockResponse()

      await expect(adminBulkUpdateStatus(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should throw BAD_REQUEST on BusinessError', async () => {
      mockOrderService.adminBulkUpdateStatus.mockRejectedValue(new BusinessError('Cannot update'))
      const req = createMockRequest({ body: { order_ids: ['o1'], status: 'shipped' } })
      const res = createMockResponse()

      await expect(adminBulkUpdateStatus(req as any, res as Response)).rejects.toMatchObject({
        status: STATUS.BAD_REQUEST,
      })
    })

    it('should rethrow generic errors', async () => {
      mockOrderService.adminBulkUpdateStatus.mockRejectedValue(new Error('DB error'))
      const req = createMockRequest({ body: { order_ids: ['o1'], status: 'shipped' } })
      const res = createMockResponse()

      await expect(adminBulkUpdateStatus(req as any, res as Response)).rejects.toThrow('DB error')
    })
  })

  describe('adminGetOrderCountByStatus', () => {
    it('should return order counts by status', async () => {
      const statusCounts = { pending: 5, shipped: 10, delivered: 20, cancelled: 2 }
      mockOrderService.adminGetOrderCountByStatus.mockResolvedValue(statusCounts as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetOrderCountByStatus(req as any, res as Response)

      expect(mockOrderService.adminGetOrderCountByStatus).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })
})
