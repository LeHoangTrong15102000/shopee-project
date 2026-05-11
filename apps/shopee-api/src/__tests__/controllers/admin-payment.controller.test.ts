/// <reference types="jest" />
import { Request, Response } from 'express'

// Mock Mongoose models — we control their static methods directly
jest.mock('@database/models/payment-method.model', () => ({
  PaymentMethodModel: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))

jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    countDocuments: jest.fn(),
  },
}))

import { PaymentMethodModel } from '@database/models/payment-method.model'
import { OrderModel } from '@database/models/order.model'
import {
  adminGetPaymentMethods,
  adminGetPaymentMethodById,
  adminCreatePaymentMethod,
  adminUpdatePaymentMethod,
  adminDeletePaymentMethod,
  adminTogglePaymentMethod,
  adminReorderPaymentMethods,
} from '@controllers/admin-payment.controller'

const mockPaymentMethodModel = PaymentMethodModel as jest.Mocked<typeof PaymentMethodModel>
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>

// ─── Request / Response helpers ───────────────────────────────────────────────

const createMockRequest = (options: {
  body?: any
  params?: Record<string, string>
  query?: Record<string, string>
} = {}): Partial<Request> => ({
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

// ─── Shared fixture ───────────────────────────────────────────────────────────

const makeMethod = (overrides: Record<string, any> = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Cash on Delivery',
  type: 'cod',
  is_active: true,
  sort_order: 0,
  ...overrides,
})

describe('admin-payment.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── adminGetPaymentMethods ────────────────────────────────────────────────

  describe('adminGetPaymentMethods', () => {
    it('returns 200 with sorted list of payment methods', async () => {
      const methods = [makeMethod({ sort_order: 0 }), makeMethod({ sort_order: 1, type: 'bank_transfer' })]
      const mockLean = jest.fn().mockResolvedValue(methods)
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(mockPaymentMethodModel.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetPaymentMethods(req as Request, res as Response)

      expect(mockPaymentMethodModel.find).toHaveBeenCalled()
      expect(mockSort).toHaveBeenCalledWith({ sort_order: 1 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ data: methods }),
      )
    })

    it('propagates error when find throws', async () => {
      const mockSort = jest.fn().mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) })
      ;(mockPaymentMethodModel.find as jest.Mock).mockReturnValue({ sort: mockSort })

      const req = createMockRequest()
      const res = createMockResponse()

      await expect(adminGetPaymentMethods(req as Request, res as Response)).rejects.toThrow('DB error')
    })
  })

  // ─── adminGetPaymentMethodById ────────────────────────────────────────────

  describe('adminGetPaymentMethodById', () => {
    it('returns 200 with the method when found', async () => {
      const method = makeMethod()
      const mockLean = jest.fn().mockResolvedValue(method)
      ;(mockPaymentMethodModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const req = createMockRequest({ params: { id: method._id } })
      const res = createMockResponse()

      await adminGetPaymentMethodById(req as Request, res as Response)

      expect(mockPaymentMethodModel.findById).toHaveBeenCalledWith(method._id)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ data: method }),
      )
    })

    it('throws ErrorHandler 404 when method not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(mockPaymentMethodModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const req = createMockRequest({ params: { id: '507f1f77bcf86cd799439011' } })
      const res = createMockResponse()

      await expect(adminGetPaymentMethodById(req as Request, res as Response)).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  // ─── adminCreatePaymentMethod ─────────────────────────────────────────────

  describe('adminCreatePaymentMethod', () => {
    it('returns 200 with the created method', async () => {
      const body = { name: 'Bank Transfer', type: 'bank_transfer' }
      const created = makeMethod({ ...body })
      ;(mockPaymentMethodModel.create as jest.Mock).mockResolvedValue(created)

      const req = createMockRequest({ body })
      const res = createMockResponse()

      await adminCreatePaymentMethod(req as Request, res as Response)

      expect(mockPaymentMethodModel.create).toHaveBeenCalledWith(body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ data: created }),
      )
    })

    it('propagates error when create rejects', async () => {
      ;(mockPaymentMethodModel.create as jest.Mock).mockRejectedValue(new Error('Validation failed'))

      const req = createMockRequest({ body: { name: 'X', type: 'cod' } })
      const res = createMockResponse()

      await expect(adminCreatePaymentMethod(req as Request, res as Response)).rejects.toThrow('Validation failed')
    })
  })

  // ─── adminUpdatePaymentMethod ─────────────────────────────────────────────

  describe('adminUpdatePaymentMethod', () => {
    it('returns 200 with updated method and uses $set + runValidators', async () => {
      const updated = makeMethod({ name: 'Updated Name' })
      const mockLean = jest.fn().mockResolvedValue(updated)
      ;(mockPaymentMethodModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const req = createMockRequest({
        params: { id: updated._id },
        body: { name: 'Updated Name' },
      })
      const res = createMockResponse()

      await adminUpdatePaymentMethod(req as Request, res as Response)

      expect(mockPaymentMethodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        updated._id,
        { $set: { name: 'Updated Name' } },
        { new: true, runValidators: true },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ data: updated }),
      )
    })

    it('throws ErrorHandler 404 when method not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(mockPaymentMethodModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const req = createMockRequest({
        params: { id: '507f1f77bcf86cd799439011' },
        body: { name: 'X' },
      })
      const res = createMockResponse()

      await expect(adminUpdatePaymentMethod(req as Request, res as Response)).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  // ─── adminDeletePaymentMethod ─────────────────────────────────────────────

  describe('adminDeletePaymentMethod', () => {
    it('throws ErrorHandler 404 when method not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(mockPaymentMethodModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const req = createMockRequest({ params: { id: '507f1f77bcf86cd799439011' } })
      const res = createMockResponse()

      await expect(adminDeletePaymentMethod(req as Request, res as Response)).rejects.toMatchObject({
        status: 404,
      })
    })

    it('throws ErrorHandler 400 when method is referenced by orders', async () => {
      const method = makeMethod({ type: 'cod' })
      const mockLean = jest.fn().mockResolvedValue(method)
      ;(mockPaymentMethodModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      ;(mockOrderModel.countDocuments as jest.Mock).mockResolvedValue(3)

      const req = createMockRequest({ params: { id: method._id } })
      const res = createMockResponse()

      await expect(adminDeletePaymentMethod(req as Request, res as Response)).rejects.toMatchObject({
        status: 400,
      })
      expect(mockOrderModel.countDocuments).toHaveBeenCalledWith({ payment_method: 'cod' })
      expect(mockPaymentMethodModel.findByIdAndDelete).not.toHaveBeenCalled()
    })

    it('deletes method and returns 200 when no orders reference it', async () => {
      const method = makeMethod({ type: 'e_wallet' })
      const mockLean = jest.fn().mockResolvedValue(method)
      ;(mockPaymentMethodModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      ;(mockOrderModel.countDocuments as jest.Mock).mockResolvedValue(0)
      ;(mockPaymentMethodModel.findByIdAndDelete as jest.Mock).mockResolvedValue(method)

      const req = createMockRequest({ params: { id: method._id } })
      const res = createMockResponse()

      await adminDeletePaymentMethod(req as Request, res as Response)

      expect(mockPaymentMethodModel.findByIdAndDelete).toHaveBeenCalledWith(method._id)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  // ─── adminTogglePaymentMethod ─────────────────────────────────────────────

  describe('adminTogglePaymentMethod', () => {
    it('toggles is_active from true to false and returns 200', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const method = { ...makeMethod({ is_active: true }), save: saveFn }
      ;(mockPaymentMethodModel.findById as jest.Mock).mockResolvedValue(method)

      const req = createMockRequest({ params: { id: method._id } })
      const res = createMockResponse()

      await adminTogglePaymentMethod(req as Request, res as Response)

      expect(method.is_active).toBe(false)
      expect(saveFn).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('toggles is_active from false to true and returns 200', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const method = { ...makeMethod({ is_active: false }), save: saveFn }
      ;(mockPaymentMethodModel.findById as jest.Mock).mockResolvedValue(method)

      const req = createMockRequest({ params: { id: method._id } })
      const res = createMockResponse()

      await adminTogglePaymentMethod(req as Request, res as Response)

      expect(method.is_active).toBe(true)
      expect(saveFn).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('throws ErrorHandler 404 when method not found', async () => {
      ;(mockPaymentMethodModel.findById as jest.Mock).mockResolvedValue(null)

      const req = createMockRequest({ params: { id: '507f1f77bcf86cd799439011' } })
      const res = createMockResponse()

      await expect(adminTogglePaymentMethod(req as Request, res as Response)).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  // ─── adminReorderPaymentMethods ───────────────────────────────────────────

  describe('adminReorderPaymentMethods', () => {
    it('calls findByIdAndUpdate for each item and returns 200', async () => {
      ;(mockPaymentMethodModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const items = [
        { id: '507f1f77bcf86cd799439011', sort_order: 0 },
        { id: '507f1f77bcf86cd799439012', sort_order: 1 },
      ]
      const req = createMockRequest({ body: { items } })
      const res = createMockResponse()

      await adminReorderPaymentMethods(req as Request, res as Response)

      expect(mockPaymentMethodModel.findByIdAndUpdate).toHaveBeenCalledTimes(2)
      expect(mockPaymentMethodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: { sort_order: 0 } },
      )
      expect(mockPaymentMethodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        { $set: { sort_order: 1 } },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('calls findByIdAndUpdate once for a single-item array', async () => {
      ;(mockPaymentMethodModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const items = [{ id: '507f1f77bcf86cd799439011', sort_order: 5 }]
      const req = createMockRequest({ body: { items } })
      const res = createMockResponse()

      await adminReorderPaymentMethods(req as Request, res as Response)

      expect(mockPaymentMethodModel.findByIdAndUpdate).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
