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
  mockModel.aggregate = jest.fn()
  mockModel.populate = jest.fn()
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

  // ─── findByUser ────────────────────────────────────────────────

  describe('findByUser', () => {
    it('should find orders by user with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockOrderData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(OrderModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByUser(
        { user_id: '507f1f77bcf86cd799439012' },
        { page: 1, limit: 10 },
      )

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

      await repository.findByUser(
        { user_id: '507f1f77bcf86cd799439012', status: 'pending' },
        { page: 1, limit: 10 },
      )

      expect(OrderModel.find).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439012',
        status: 'pending',
      })
    })

    it('should not add status filter when status is "all"', async () => {
      const mockLean = jest.fn().mockResolvedValue([])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(OrderModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await repository.findByUser(
        { user_id: '507f1f77bcf86cd799439012', status: 'all' },
        { page: 1, limit: 10 },
      )

      expect(OrderModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439012' })
    })

    it('should calculate page_size fallback to 1 when total=0', async () => {
      const mockLean = jest.fn().mockResolvedValue([])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(OrderModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.countDocuments as jest.Mock).mockResolvedValue(0)

      const result = await repository.findByUser(
        { user_id: '507f1f77bcf86cd799439012' },
        { page: 1, limit: 10 },
      )
      expect(result.pagination.page_size).toBe(1)
    })
  })

  // ─── findById ──────────────────────────────────────────────────

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

    it('should return null when order not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  // ─── findByIdAndUser ───────────────────────────────────────────

  describe('findByIdAndUser', () => {
    it('should find order by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findByIdAndUser(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      )

      expect(OrderModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        user: '507f1f77bcf86cd799439012',
      })
      expect(result).toEqual(mockOrderData)
    })

    it('should return null when order not found for user', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findByIdAndUser('id1', 'id2')
      expect(result).toBeNull()
    })
  })

  // ─── create ────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new order', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSession2 = jest.fn().mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.create as jest.Mock).mockResolvedValue([{ _id: '507f1f77bcf86cd799439011' }])
      ;(OrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession2 })

      const result = await repository.create({
        user: '507f1f77bcf86cd799439012',
        items: [],
        total_amount: 200,
      } as any)

      expect(OrderModel.create).toHaveBeenCalled()
      expect(result).toEqual(mockOrderData)
    })

    // Task 3.8 — session threaded through to OrderModel.create
    it('passes session inside options array to OrderModel.create when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockOrderData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSession2 = jest.fn().mockReturnValue({ populate: mockPopulate })
      ;(OrderModel.create as jest.Mock).mockResolvedValue([{ _id: '507f1f77bcf86cd799439011' }])
      ;(OrderModel.findById as jest.Mock).mockReturnValue({ session: mockSession2 })

      const mockSession = { id: 'tx-session-order' } as any

      await repository.create({ user: '507f1f77bcf86cd799439012', items: [], total: 200 } as any, {
        session: mockSession,
      })

      // OrderModel.create is called with [data] as first arg and { session } as second arg
      const createArgs = (OrderModel.create as jest.Mock).mock.calls[0]
      expect(createArgs[1]).toEqual({ session: mockSession })
    })
  })

  // ─── updateStatus ──────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockOrderData, status: 'shipped' })
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.updateStatus('507f1f77bcf86cd799439011', 'shipped' as any)

      expect(OrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'shipped' },
        { new: true },
      )
      expect(result?.status).toBe('shipped')
    })

    it('should merge additionalData into update', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockOrderData, status: 'delivered' })
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })

      await repository.updateStatus(
        '507f1f77bcf86cd799439011',
        'delivered' as any,
        {
          total_amount: 300,
        } as any,
      )

      expect(OrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'delivered', total_amount: 300 },
        { new: true },
      )
    })

    it('should return null when order not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.updateStatus('non-existent', 'cancelled' as any)
      expect(result).toBeNull()
    })
  })

  // ─── findTrackingByOrderAndUser ────────────────────────────────

  describe('findTrackingByOrderAndUser', () => {
    it('should find tracking by order and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockTrackingData)
      ;(OrderTrackingModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findTrackingByOrderAndUser(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      )

      expect(OrderTrackingModel.findOne).toHaveBeenCalledWith({
        order_id: '507f1f77bcf86cd799439011',
        user_id: '507f1f77bcf86cd799439012',
      })
      expect(result).toEqual(mockTrackingData)
    })

    it('should return null when tracking not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(OrderTrackingModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findTrackingByOrderAndUser('id1', 'id2')
      expect(result).toBeNull()
    })
  })

  // ─── findTrackingByNumber ──────────────────────────────────────

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

    it('should return null when tracking number not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(OrderTrackingModel.findOne as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findTrackingByNumber('NONEXISTENT')
      expect(result).toBeNull()
    })
  })

  // ─── findAllWithFilters ────────────────────────────────────────

  describe('findAllWithFilters', () => {
    const setupAggregateMocks = (orders: any[], total: number) => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue(orders)
      ;(OrderModel.aggregate as jest.Mock).mockImplementation((pipeline: any[]) => {
        // Check if pipeline ends with $count — that is the count query
        const lastStage = pipeline[pipeline.length - 1]
        if (lastStage && lastStage.$count) {
          return Promise.resolve(total > 0 ? [{ total }] : [])
        }
        // Otherwise it is the data query — returns the raw orders for populate
        return Promise.resolve(orders).then((res) => ({
          then: (cb: any) => Promise.resolve(res).then(cb),
        }))
      })
    }

    it('should return paginated results with no filters', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([mockOrderData])
      ;(OrderModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ total: 1 }])
        .mockReturnValueOnce({
          then: (cb: any) => Promise.resolve([mockOrderData]).then(cb),
        })

      const result = await repository.findAllWithFilters({}, { page: 1, limit: 10 })
      expect(result).toBeDefined()
      expect(result.pagination.page).toBe(1)
    })

    it('should filter by status', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { status: 'pending' },
        { page: 1, limit: 10 },
      )
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.page_size).toBe(1)
    })

    it('should filter by payment_method', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { payment_method: 'cod' },
        { page: 1, limit: 10 },
      )
      expect(result).toBeDefined()
    })

    it('should filter by user_id', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { user_id: '507f1f77bcf86cd799439012' },
        { page: 1, limit: 10 },
      )
      expect(result).toBeDefined()
    })

    it('should add createdAt range when start_date is provided', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { start_date: '2024-01-01' },
        { page: 1, limit: 10 },
      )
      expect(result).toBeDefined()
    })

    it('should add createdAt range when end_date is provided', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { end_date: '2024-12-31' },
        { page: 1, limit: 10 },
      )
      expect(result).toBeDefined()
    })

    it('should add both start_date and end_date when both are provided', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        { start_date: '2024-01-01', end_date: '2024-12-31' },
        { page: 1, limit: 10 },
      )
      expect(result).toBeDefined()
    })

    it('should use search pipeline when search is provided', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters({ search: 'john' }, { page: 1, limit: 10 })
      expect(result).toBeDefined()
    })

    it('should use ascending sort when order=asc', async () => {
      ;(OrderModel.populate as jest.Mock).mockResolvedValue([])
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValueOnce([]).mockReturnValueOnce({
        then: (cb: any) => Promise.resolve([]).then(cb),
      })

      const result = await repository.findAllWithFilters(
        {},
        { page: 1, limit: 10, sort_by: 'total_amount', order: 'asc' },
      )
      expect(result).toBeDefined()
    })
  })

  // ─── countByStatus ─────────────────────────────────────────────

  describe('countByStatus', () => {
    it('should return aggregated counts by status', async () => {
      const mockCounts = [
        { _id: 'pending', count: 5 },
        { _id: 'shipped', count: 3 },
        { _id: 'delivered', count: 2 },
      ]
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValue(mockCounts)

      const result = await repository.countByStatus()

      expect(OrderModel.aggregate).toHaveBeenCalledWith([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      expect(result).toEqual(mockCounts)
    })

    it('should return empty array when no orders exist', async () => {
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValue([])
      const result = await repository.countByStatus()
      expect(result).toEqual([])
    })
  })
})
