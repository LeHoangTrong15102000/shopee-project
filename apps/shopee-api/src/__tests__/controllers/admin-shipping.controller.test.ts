/// <reference types="jest" />
import { Request, Response } from 'express'

const mockShippingFind = jest.fn()
const mockShippingFindById = jest.fn()
const mockShippingCreate = jest.fn()
const mockShippingFindByIdAndUpdate = jest.fn()
const mockShippingFindByIdAndDelete = jest.fn()
const mockShippingFindByIdForToggle = jest.fn()
const mockOrderCountDocuments = jest.fn()

jest.mock('@database/models/shipping-method.model', () => ({
  ShippingMethodModel: {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: mockShippingFind,
    })),
    findById: jest.fn(),
    create: mockShippingCreate,
    findByIdAndUpdate: mockShippingFindByIdAndUpdate,
    findByIdAndDelete: mockShippingFindByIdAndDelete,
  },
}))

jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    countDocuments: mockOrderCountDocuments,
  },
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any = {}) => {
    res.status(200).send({ data })
  }),
  ErrorHandler: class ErrorHandler extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

jest.mock('@constants/status', () => ({
  STATUS: {
    OK: 200,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
  },
}))

import {
  adminGetShippingMethods,
  adminGetShippingMethodById,
  adminCreateShippingMethod,
  adminUpdateShippingMethod,
  adminDeleteShippingMethod,
  adminToggleShippingMethod,
  adminReorderShippingMethods,
} from '../../controllers/admin-shipping.controller'
import { ShippingMethodModel } from '@database/models/shipping-method.model'

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

describe('AdminShippingController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('adminGetShippingMethods', () => {
    it('returns all shipping methods sorted by sort_order', async () => {
      const methods = [
        { _id: 'm1', name: 'Standard', sort_order: 1 },
        { _id: 'm2', name: 'Express', sort_order: 2 },
      ]
      mockShippingFind.mockResolvedValue(methods)

      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetShippingMethods(req as Request, res as Response)

      expect(ShippingMethodModel.find).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminGetShippingMethodById', () => {
    it('returns method when found', async () => {
      const method = { _id: 'm1', name: 'Standard' }
      ;(ShippingMethodModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(method),
      })

      const req = createMockRequest({ params: { id: 'm1' } })
      const res = createMockResponse()

      await adminGetShippingMethodById(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('throws 404 when method not found', async () => {
      ;(ShippingMethodModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const req = createMockRequest({ params: { id: 'nonexistent' } })
      const res = createMockResponse()

      await expect(adminGetShippingMethodById(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminCreateShippingMethod', () => {
    it('creates method and returns 200 (responseSuccess always returns 200)', async () => {
      const newMethod = { _id: 'm3', name: 'Overnight', price: 50000 }
      mockShippingCreate.mockResolvedValue(newMethod)

      const req = createMockRequest({
        body: { name: 'Overnight', price: 50000, estimated_days_min: 1, estimated_days_max: 1 },
      })
      const res = createMockResponse()

      await adminCreateShippingMethod(req as Request, res as Response)

      expect(ShippingMethodModel.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminUpdateShippingMethod', () => {
    it('updates method and returns 200', async () => {
      const updated = { _id: 'm1', name: 'Updated Standard', price: 30000 }
      mockShippingFindByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updated),
      })

      const req = createMockRequest({
        params: { id: 'm1' },
        body: { name: 'Updated Standard', price: 30000 },
      })
      const res = createMockResponse()

      await adminUpdateShippingMethod(req as Request, res as Response)

      expect(ShippingMethodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'm1',
        { $set: req.body },
        { new: true, runValidators: true },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('throws 404 when method not found', async () => {
      mockShippingFindByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const req = createMockRequest({ params: { id: 'nonexistent' }, body: { name: 'X' } })
      const res = createMockResponse()

      await expect(adminUpdateShippingMethod(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminDeleteShippingMethod', () => {
    it('deletes method when not in use by orders', async () => {
      ;(ShippingMethodModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'm1', name: 'Standard' }),
      })
      mockOrderCountDocuments.mockResolvedValue(0)
      mockShippingFindByIdAndDelete.mockResolvedValue({})

      const req = createMockRequest({ params: { id: 'm1' } })
      const res = createMockResponse()

      await adminDeleteShippingMethod(req as Request, res as Response)

      expect(ShippingMethodModel.findByIdAndDelete).toHaveBeenCalledWith('m1')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('throws 400 when method is in use by orders', async () => {
      ;(ShippingMethodModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'm1', name: 'Standard' }),
      })
      mockOrderCountDocuments.mockResolvedValue(5)

      const req = createMockRequest({ params: { id: 'm1' } })
      const res = createMockResponse()

      await expect(adminDeleteShippingMethod(req as Request, res as Response)).rejects.toThrow()
    })

    it('throws 404 when method not found', async () => {
      ;(ShippingMethodModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const req = createMockRequest({ params: { id: 'nonexistent' } })
      const res = createMockResponse()

      await expect(adminDeleteShippingMethod(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminToggleShippingMethod', () => {
    it('flips is_active from true to false', async () => {
      const mockMethod = {
        _id: 'm1',
        is_active: true,
        save: jest.fn().mockResolvedValue({}),
      }
      ;(ShippingMethodModel.findById as jest.Mock).mockResolvedValue(mockMethod)

      const req = createMockRequest({ params: { id: 'm1' } })
      const res = createMockResponse()

      await adminToggleShippingMethod(req as Request, res as Response)

      expect(mockMethod.is_active).toBe(false)
      expect(mockMethod.save).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('flips is_active from false to true', async () => {
      const mockMethod = {
        _id: 'm1',
        is_active: false,
        save: jest.fn().mockResolvedValue({}),
      }
      ;(ShippingMethodModel.findById as jest.Mock).mockResolvedValue(mockMethod)

      const req = createMockRequest({ params: { id: 'm1' } })
      const res = createMockResponse()

      await adminToggleShippingMethod(req as Request, res as Response)

      expect(mockMethod.is_active).toBe(true)
    })

    it('throws 404 when method not found', async () => {
      ;(ShippingMethodModel.findById as jest.Mock).mockResolvedValue(null)

      const req = createMockRequest({ params: { id: 'nonexistent' } })
      const res = createMockResponse()

      await expect(adminToggleShippingMethod(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminReorderShippingMethods', () => {
    it('passes ordered array to findByIdAndUpdate for each item', async () => {
      mockShippingFindByIdAndUpdate.mockResolvedValue({})

      const items = [
        { id: 'm1', sort_order: 1 },
        { id: 'm2', sort_order: 2 },
        { id: 'm3', sort_order: 3 },
      ]
      const req = createMockRequest({ body: { items } })
      const res = createMockResponse()

      await adminReorderShippingMethods(req as Request, res as Response)

      expect(ShippingMethodModel.findByIdAndUpdate).toHaveBeenCalledTimes(3)
      expect(ShippingMethodModel.findByIdAndUpdate).toHaveBeenCalledWith('m1', {
        $set: { sort_order: 1 },
      })
      expect(ShippingMethodModel.findByIdAndUpdate).toHaveBeenCalledWith('m2', {
        $set: { sort_order: 2 },
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
