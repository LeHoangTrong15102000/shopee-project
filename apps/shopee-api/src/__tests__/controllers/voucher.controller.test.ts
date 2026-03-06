/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../services/base.service', () => {
  class ValidationError extends Error { constructor(m: string) { super(m); this.name = 'ValidationError' } }
  class NotFoundError extends Error { constructor(m: string) { super(m); this.name = 'NotFoundError' } }
  class BusinessError extends Error { constructor(m: string) { super(m); this.name = 'BusinessError' } }
  return { ValidationError, NotFoundError, BusinessError }
})

jest.mock('../../container', () => ({
  voucherService: {
    getAvailableVouchers: jest.fn(),
    getVoucherByCode: jest.fn(),
    applyVoucher: jest.fn(),
    collectVoucher: jest.fn(),
    getSavedVouchers: jest.fn(),
    validateVoucher: jest.fn(),
    useVoucher: jest.fn(),
  },
}))

import { voucherService } from '../../container'
import { ValidationError, NotFoundError, BusinessError } from '../../services/base.service'
import {
  getVouchers,
  getVoucherByCode,
  applyVoucher,
  saveVoucher,
  getSavedVouchers,
  getAvailableVouchers,
  getMyVouchers,
  collectVoucher,
  validateVoucher,
} from '../../controllers/voucher.controller'

const mockVoucherService = voucherService as jest.Mocked<typeof voucherService>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || { id: 'user123', email: 'test@test.com', roles: ['User'], created_at: '2024-01-01' },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockVoucher = {
  _id: 'voucher123',
  code: 'DISCOUNT10',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_value: 100000,
  max_discount: 50000,
  usage_limit: 100,
  used_count: 10,
  start_date: new Date(),
  end_date: new Date(),
}

const mockPaginationResult = {
  data: [mockVoucher],
  pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
}

describe('Voucher Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getVouchers', () => {
    it('should return vouchers with default pagination', async () => {
      mockVoucherService.getAvailableVouchers.mockResolvedValue(mockPaginationResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getVouchers(req as Request, res as Response)

      expect(mockVoucherService.getAvailableVouchers).toHaveBeenCalledWith({ page: 1, limit: 10 }, undefined, undefined)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách voucher thành công',
        data: {
          vouchers: mockPaginationResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and discount_type filter', async () => {
      mockVoucherService.getAvailableVouchers.mockResolvedValue(mockPaginationResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20', discount_type: 'percentage' } })
      const res = createMockResponse()

      await getVouchers(req as Request, res as Response)

      expect(mockVoucherService.getAvailableVouchers).toHaveBeenCalledWith(
        { page: 2, limit: 20 },
        undefined,
        { discount_type: 'percentage' }
      )
    })

    it('should propagate service errors', async () => {
      mockVoucherService.getAvailableVouchers.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getVouchers(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getVoucherByCode', () => {
    it('should return voucher by code successfully', async () => {
      mockVoucherService.getVoucherByCode.mockResolvedValue(mockVoucher as any)
      const req = createMockRequest({ params: { code: 'DISCOUNT10' } })
      const res = createMockResponse()

      await getVoucherByCode(req as Request, res as Response)

      expect(mockVoucherService.getVoucherByCode).toHaveBeenCalledWith('DISCOUNT10')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy thông tin voucher thành công',
        data: mockVoucher,
      })
    })

    it('should return 404 on NotFoundError', async () => {
      mockVoucherService.getVoucherByCode.mockRejectedValue(new NotFoundError('Voucher not found'))
      const req = createMockRequest({ params: { code: 'INVALID' } })
      const res = createMockResponse()

      await getVoucherByCode(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Không tìm thấy voucher' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.getVoucherByCode.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest({ params: { code: 'DISCOUNT10' } })
      const res = createMockResponse()

      await expect(getVoucherByCode(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('applyVoucher', () => {
    const mockApplyResult = { discount_amount: 10000, final_price: 90000 }

    it('should apply voucher successfully', async () => {
      mockVoucherService.applyVoucher.mockResolvedValue(mockApplyResult as any)
      const req = createMockRequest({
        body: { code: 'DISCOUNT10', order_value: 100000, product_ids: ['p1'], category_ids: ['c1'] },
      })
      const res = createMockResponse()

      await applyVoucher(req as Request, res as Response)

      expect(mockVoucherService.applyVoucher).toHaveBeenCalledWith({
        code: 'DISCOUNT10',
        order_value: 100000,
        product_ids: ['p1'],
        category_ids: ['c1'],
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Áp dụng voucher thành công',
        data: mockApplyResult,
      })
    })

    it('should use default empty arrays for product_ids and category_ids', async () => {
      mockVoucherService.applyVoucher.mockResolvedValue(mockApplyResult as any)
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_value: 100000 } })
      const res = createMockResponse()

      await applyVoucher(req as Request, res as Response)

      expect(mockVoucherService.applyVoucher).toHaveBeenCalledWith({
        code: 'DISCOUNT10',
        order_value: 100000,
        product_ids: [],
        category_ids: [],
      })
    })

    it('should return 404 on NotFoundError', async () => {
      mockVoucherService.applyVoucher.mockRejectedValue(new NotFoundError('Voucher not found'))
      const req = createMockRequest({ body: { code: 'INVALID', order_value: 100000 } })
      const res = createMockResponse()

      await applyVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Không tìm thấy voucher' })
    })

    it('should return 400 on BusinessError', async () => {
      mockVoucherService.applyVoucher.mockRejectedValue(new BusinessError('Voucher đã hết lượt sử dụng'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_value: 100000 } })
      const res = createMockResponse()

      await applyVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Voucher đã hết lượt sử dụng' })
    })

    it('should return 400 on ValidationError', async () => {
      mockVoucherService.applyVoucher.mockRejectedValue(new ValidationError('Giá trị đơn hàng không đủ'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_value: 1000 } })
      const res = createMockResponse()

      await applyVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Giá trị đơn hàng không đủ' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.applyVoucher.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_value: 100000 } })
      const res = createMockResponse()

      await expect(applyVoucher(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('saveVoucher', () => {
    const mockSaveResult = { user_id: 'user123', voucher_id: 'voucher123', saved_at: new Date() }

    it('should save voucher successfully', async () => {
      mockVoucherService.collectVoucher.mockResolvedValue(mockSaveResult as any)
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await saveVoucher(req as Request, res as Response)

      expect(mockVoucherService.collectVoucher).toHaveBeenCalledWith('user123', 'voucher123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lưu voucher thành công',
        data: mockSaveResult,
      })
    })

    it('should return 404 on NotFoundError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new NotFoundError('Voucher not found'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await saveVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Không tìm thấy voucher' })
    })

    it('should return 400 on BusinessError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new BusinessError('Voucher đã được lưu'))
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await saveVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Voucher đã được lưu' })
    })

    it('should return 400 on ValidationError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new ValidationError('Invalid voucher id'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await saveVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid voucher id' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await expect(saveVoucher(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getSavedVouchers', () => {
    const mockSavedVouchersResult = {
      data: [mockVoucher],
      pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
    }

    it('should return saved vouchers with default pagination', async () => {
      mockVoucherService.getSavedVouchers.mockResolvedValue(mockSavedVouchersResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getSavedVouchers(req as Request, res as Response)

      expect(mockVoucherService.getSavedVouchers).toHaveBeenCalledWith('user123', { page: 1, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách voucher đã lưu thành công',
        data: {
          saved_vouchers: mockSavedVouchersResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination', async () => {
      mockVoucherService.getSavedVouchers.mockResolvedValue(mockSavedVouchersResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20' } })
      const res = createMockResponse()

      await getSavedVouchers(req as Request, res as Response)

      expect(mockVoucherService.getSavedVouchers).toHaveBeenCalledWith('user123', { page: 2, limit: 20 })
    })

    it('should return 400 on ValidationError', async () => {
      mockVoucherService.getSavedVouchers.mockRejectedValue(new ValidationError('Invalid pagination'))
      const req = createMockRequest({ query: { page: '-1' } })
      const res = createMockResponse()

      await getSavedVouchers(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid pagination' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.getSavedVouchers.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getSavedVouchers(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getAvailableVouchers', () => {
    it('should return available vouchers with user_id', async () => {
      mockVoucherService.getAvailableVouchers.mockResolvedValue(mockPaginationResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getAvailableVouchers(req as Request, res as Response)

      expect(mockVoucherService.getAvailableVouchers).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'user123', undefined)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách voucher khả dụng thành công',
        data: {
          vouchers: mockPaginationResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and discount_type filter', async () => {
      mockVoucherService.getAvailableVouchers.mockResolvedValue(mockPaginationResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20', discount_type: 'fixed' } })
      const res = createMockResponse()

      await getAvailableVouchers(req as Request, res as Response)

      expect(mockVoucherService.getAvailableVouchers).toHaveBeenCalledWith(
        { page: 2, limit: 20 },
        'user123',
        { discount_type: 'fixed' }
      )
    })

    it('should propagate service errors', async () => {
      mockVoucherService.getAvailableVouchers.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getAvailableVouchers(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getMyVouchers', () => {
    const mockMyVouchersResult = {
      data: [mockVoucher],
      pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
    }

    it('should return my vouchers with default pagination', async () => {
      mockVoucherService.getSavedVouchers.mockResolvedValue(mockMyVouchersResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getMyVouchers(req as Request, res as Response)

      expect(mockVoucherService.getSavedVouchers).toHaveBeenCalledWith('user123', { page: 1, limit: 10 }, undefined)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách voucher của tôi thành công',
        data: {
          vouchers: mockMyVouchersResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and status filter', async () => {
      mockVoucherService.getSavedVouchers.mockResolvedValue(mockMyVouchersResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20', status: 'available' } })
      const res = createMockResponse()

      await getMyVouchers(req as Request, res as Response)

      expect(mockVoucherService.getSavedVouchers).toHaveBeenCalledWith('user123', { page: 2, limit: 20 }, 'available')
    })

    it('should return 400 on ValidationError', async () => {
      mockVoucherService.getSavedVouchers.mockRejectedValue(new ValidationError('Invalid status'))
      const req = createMockRequest({ query: { status: 'invalid' } })
      const res = createMockResponse()

      await getMyVouchers(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.getSavedVouchers.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getMyVouchers(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('collectVoucher', () => {
    const mockCollectResult = { user_id: 'user123', voucher_id: 'voucher123', collected_at: new Date() }

    it('should collect voucher successfully', async () => {
      mockVoucherService.collectVoucher.mockResolvedValue(mockCollectResult as any)
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await collectVoucher(req as Request, res as Response)

      expect(mockVoucherService.collectVoucher).toHaveBeenCalledWith('user123', 'voucher123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Thu thập voucher thành công',
        data: mockCollectResult,
      })
    })

    it('should return 404 on NotFoundError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new NotFoundError('Voucher not found'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await collectVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Không tìm thấy voucher' })
    })

    it('should return 400 on BusinessError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new BusinessError('Voucher đã được thu thập'))
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await collectVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Voucher đã được thu thập' })
    })

    it('should return 400 on ValidationError', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new ValidationError('Invalid voucher id'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await collectVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid voucher id' })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.collectVoucher.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest({ params: { id: 'voucher123' } })
      const res = createMockResponse()

      await expect(collectVoucher(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('validateVoucher', () => {
    const mockValidateResult = { is_valid: true, discount_amount: 10000, voucher: mockVoucher }

    it('should validate voucher successfully', async () => {
      mockVoucherService.validateVoucher.mockResolvedValue(mockValidateResult as any)
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_total: 100000 } })
      const res = createMockResponse()

      await validateVoucher(req as Request, res as Response)

      expect(mockVoucherService.validateVoucher).toHaveBeenCalledWith('user123', 'DISCOUNT10', 100000)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Voucher hợp lệ',
        data: mockValidateResult,
      })
    })

    it('should return 404 with is_valid: false on NotFoundError', async () => {
      mockVoucherService.validateVoucher.mockRejectedValue(new NotFoundError('Voucher not found'))
      const req = createMockRequest({ body: { code: 'INVALID', order_total: 100000 } })
      const res = createMockResponse()

      await validateVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Không tìm thấy voucher',
        data: { is_valid: false },
      })
    })

    it('should return 400 with is_valid: false on BusinessError', async () => {
      mockVoucherService.validateVoucher.mockRejectedValue(new BusinessError('Voucher đã hết hạn'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_total: 100000 } })
      const res = createMockResponse()

      await validateVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Voucher đã hết hạn',
        data: { is_valid: false },
      })
    })

    it('should return 400 with is_valid: false on ValidationError', async () => {
      mockVoucherService.validateVoucher.mockRejectedValue(new ValidationError('Giá trị đơn hàng không đủ'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_total: 1000 } })
      const res = createMockResponse()

      await validateVoucher(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Giá trị đơn hàng không đủ',
        data: { is_valid: false },
      })
    })

    it('should propagate other errors', async () => {
      mockVoucherService.validateVoucher.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest({ body: { code: 'DISCOUNT10', order_total: 100000 } })
      const res = createMockResponse()

      await expect(validateVoucher(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })
})