/// <reference types="jest" />

const mockOrderData = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  items: [{ product: '507f1f77bcf86cd799439013', quantity: 2, price: 100 }],
  total_amount: 200,
  status: 'pending',
  createdAt: new Date(),
}

const mockTrackingData = {
  _id: '507f1f77bcf86cd799439020',
  order_id: '507f1f77bcf86cd799439011',
  user_id: '507f1f77bcf86cd799439012',
  tracking_number: 'TRK123456',
  status: 'shipped',
}

jest.mock('@database/models/order.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
  }))
  mockModel.find = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.create = jest.fn()
  return { OrderModel: mockModel, OrderStatusType: {} }
})

jest.mock('@database/models/order-tracking.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findOne = jest.fn()
  return { OrderTrackingModel: mockModel }
})

import { OrderModel } from '@database/models/order.model'
import { OrderTrackingModel } from '@database/models/order-tracking.model'
import { OrderRepository } from '../../repositories/order.repository'

describe('OrderRepository', () => {
  let repository: OrderRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new OrderRepository()
  })

  describe('findByUser', () => {
    it('should find orders by user with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockOrderData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(OrderModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByUser({ user_id: '507f1f77bcf86cd799439012' }, { page: 1, limit: 10 })

      expect(OrderModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439012' })
      expect(result.data).toEqual([mockOrderData])
      expect(result.pagination).toEqual({ page: 1, limit: 10, page_size: 1, total: 1 })
    })

    it('should filter by status when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockOrderData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(OrderModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findByUser({ user_id: '507f1f77bcf86cd799439012', status: 'pending' }, { page: 1, limit: 10 })

      expect(OrderModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439012', status: 'pending' })
    })
  })

  describe('findById', () => {
    it('should find order by id with populated items', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(OrderModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(mockPopulate).toHaveBeenCalledWith('items.product')
      expect(result).toEqual(mockOrderData)
    })
  })

  describe('findByIdAndUser', () => {
    it('should find order by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findByIdAndUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')

      expect(OrderModel.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', user: '507f1f77bcf86cd799439012' })
      expect(result).toEqual(mockOrderData)
    })
  })

  describe('create', () => {
    it('should create a new order', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.create as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      ;(OrderModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.create({ user: '507f1f77bcf86cd799439012', items: [], total_amount: 200 } as any)

      expect(OrderModel.create).toHaveBeenCalled()
      expect(result).toEqual(mockOrderData)
    })
  })

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockOrderData, status: 'shipped' })
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.updateStatus('507f1f77bcf86cd799439011', 'shipped' as any)

      expect(OrderModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'shipped' }, { new: true })
      expect(result?.status).toBe('shipped')
    })
  })

  describe('findTrackingByOrderAndUser', () => {
    it('should find tracking by order and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockTrackingData)
      ;(OrderTrackingModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findTrackingByOrderAndUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')

      expect(OrderTrackingModel.findOne).toHaveBeenCalledWith({ order_id: '507f1f77bcf86cd799439011', user_id: '507f1f77bcf86cd799439012' })
      expect(result).toEqual(mockTrackingData)
    })
  })

  describe('findTrackingByNumber', () => {
    it('should find tracking by tracking number', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockTrackingData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderTrackingModel.findOne as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findTrackingByNumber('TRK123456')

      expect(OrderTrackingModel.findOne).toHaveBeenCalledWith({ tracking_number: 'TRK123456' })
      expect(mockSelect).toHaveBeenCalledWith('-user_id')
      expect(result).toEqual(mockTrackingData)
    })
  })
})

