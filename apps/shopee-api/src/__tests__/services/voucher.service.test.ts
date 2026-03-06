/// <reference types="jest" />
import { VoucherService } from '@services/voucher.service'
import { IVoucherRepository } from '@repositories/interfaces/voucher.repository.interface'
import { NotFoundError, BusinessError, ValidationError } from '@services/base.service'
import { Types } from 'mongoose'

const createMockVoucher = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  code: 'TEST10',
  discount_type: 'percentage' as const,
  discount_value: 10,
  min_order_value: 100000,
  max_discount: 50000,
  usage_limit: 100,
  used_count: 0,
  is_active: true,
  start_date: new Date('2025-01-01'),
  end_date: new Date('2027-12-31'),
  applicable_products: [],
  applicable_categories: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

const mockVoucherRepository = {
  findAvailable: jest.fn(),
  findByCode: jest.fn(),
  findById: jest.fn(),
  incrementUsedCount: jest.fn(),
  findSavedByUser: jest.fn(),
  findSavedVoucher: jest.fn(),
  saveVoucher: jest.fn(),
  getCollectedVoucherIds: jest.fn(),
  markVoucherUsed: jest.fn(),
} as unknown as jest.Mocked<IVoucherRepository>

describe('VoucherService', () => {
  let service: VoucherService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new VoucherService(mockVoucherRepository)
  })

  describe('getAvailableVouchers', () => {
    it('returns vouchers without is_collected when no userId', async () => {
      const vouchers = [createMockVoucher()]
      mockVoucherRepository.findAvailable.mockResolvedValue({ data: vouchers, pagination: { page: 1, limit: 10, page_size: 1, total: 1 } })

      const result = await service.getAvailableVouchers({ page: 1, limit: 10 })

      expect(result.data).toEqual(vouchers)
      expect(mockVoucherRepository.getCollectedVoucherIds).not.toHaveBeenCalled()
    })

    it('adds is_collected flag when userId provided', async () => {
      const voucher = createMockVoucher()
      mockVoucherRepository.findAvailable.mockResolvedValue({ data: [voucher], pagination: { page: 1, limit: 10, page_size: 1, total: 1 } })
      mockVoucherRepository.getCollectedVoucherIds.mockResolvedValue([voucher._id.toString()])

      const result = await service.getAvailableVouchers({ page: 1, limit: 10 }, new Types.ObjectId().toString())

      expect(result.data[0].is_collected).toBe(true)
    })
  })

  describe('getVoucherByCode', () => {
    it('returns voucher with valid status', async () => {
      const voucher = createMockVoucher()
      mockVoucherRepository.findByCode.mockResolvedValue(voucher)

      const result = await service.getVoucherByCode('TEST10')

      expect(result.voucher).toEqual(voucher)
      expect(result.status.is_valid).toBe(true)
    })

    it('throws NotFoundError when voucher not found', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(null)

      await expect(service.getVoucherByCode('INVALID')).rejects.toThrow(NotFoundError)
    })
  })

  describe('applyVoucher', () => {
    it('applies percentage discount correctly', async () => {
      const voucher = createMockVoucher()
      mockVoucherRepository.findByCode.mockResolvedValue(voucher)

      const result = await service.applyVoucher({ code: 'TEST10', order_value: 200000 })

      expect(result.discount_amount).toBe(20000)
      expect(result.final_value).toBe(180000)
    })

    it('throws BusinessError when voucher expired', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ end_date: new Date('2020-01-01') }))

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 200000 })).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when voucher not started', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ start_date: new Date('2030-01-01') }))

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 200000 })).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when voucher used up', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ used_count: 100 }))

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 200000 })).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when min order value not met', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher())

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 50000 })).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when product restriction fails', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ applicable_products: [new Types.ObjectId()] }))

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 200000, product_ids: ['other'] })).rejects.toThrow(BusinessError)
    })

    it('applies fixed amount discount', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ discount_type: 'fixed_amount', discount_value: 30000 }))

      const result = await service.applyVoucher({ code: 'TEST10', order_value: 200000 })

      expect(result.discount_amount).toBe(30000)
    })

    it('caps percentage discount at max_discount', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ discount_value: 50, max_discount: 50000 }))

      const result = await service.applyVoucher({ code: 'TEST10', order_value: 500000 })

      expect(result.discount_amount).toBe(50000)
    })
  })

  describe('collectVoucher', () => {
    const userId = new Types.ObjectId().toString()
    const voucherId = new Types.ObjectId().toString()

    it('collects voucher successfully', async () => {
      const voucher = createMockVoucher({ _id: new Types.ObjectId(voucherId) })
      mockVoucherRepository.findById.mockResolvedValue(voucher)
      mockVoucherRepository.findSavedVoucher.mockResolvedValue(null)
      mockVoucherRepository.saveVoucher.mockResolvedValue({ user: userId, voucher: voucherId, status: 'available' } as any)

      const result = await service.collectVoucher(userId, voucherId)

      expect(result.status).toBe('available')
    })

    it('throws BusinessError when already collected', async () => {
      mockVoucherRepository.findById.mockResolvedValue(createMockVoucher())
      mockVoucherRepository.findSavedVoucher.mockResolvedValue({ status: 'available' } as any)

      await expect(service.collectVoucher(userId, voucherId)).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when voucher inactive', async () => {
      mockVoucherRepository.findById.mockResolvedValue(createMockVoucher({ is_active: false }))

      await expect(service.collectVoucher(userId, voucherId)).rejects.toThrow(BusinessError)
    })
  })

  describe('getSavedVouchers', () => {
    const userId = new Types.ObjectId().toString()

    it('returns saved vouchers with computed_status', async () => {
      const voucher = createMockVoucher()
      const savedVoucher = { user: userId, voucher, status: 'available' }
      mockVoucherRepository.findSavedByUser.mockResolvedValue({
        data: [savedVoucher],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      } as any)

      const result = await service.getSavedVouchers(userId, { page: 1, limit: 10 })

      expect(result.data[0].computed_status).toBe('available')
    })

    it('handles expired voucher status', async () => {
      const expiredVoucher = createMockVoucher({ end_date: new Date('2020-01-01') })
      const savedVoucher = { user: userId, voucher: expiredVoucher, status: 'available' }
      mockVoucherRepository.findSavedByUser.mockResolvedValue({
        data: [savedVoucher],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      } as any)

      const result = await service.getSavedVouchers(userId, { page: 1, limit: 10 })

      expect(result.data[0].computed_status).toBe('expired')
    })

    it('throws ValidationError for invalid userId', async () => {
      await expect(service.getSavedVouchers('invalid-id', { page: 1, limit: 10 })).rejects.toThrow(ValidationError)
    })
  })

  describe('validateVoucher', () => {
    const userId = new Types.ObjectId().toString()

    it('returns is_valid true on success', async () => {
      const voucher = createMockVoucher()
      mockVoucherRepository.findByCode.mockResolvedValue(voucher)
      mockVoucherRepository.findSavedVoucher.mockResolvedValue({ status: 'available' } as any)

      const result = await service.validateVoucher(userId, 'TEST10', 200000)

      expect(result.is_valid).toBe(true)
      expect(result.discount_amount).toBe(20000)
    })

    it('throws NotFoundError when voucher not found', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(null)

      await expect(service.validateVoucher(userId, 'INVALID', 200000)).rejects.toThrow(NotFoundError)
    })

    it('throws BusinessError when user has not collected voucher', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher())
      mockVoucherRepository.findSavedVoucher.mockResolvedValue(null)

      await expect(service.validateVoucher(userId, 'TEST10', 200000)).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when voucher not started', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ start_date: new Date('2030-01-01') }))
      mockVoucherRepository.findSavedVoucher.mockResolvedValue({ status: 'available' } as any)

      await expect(service.validateVoucher(userId, 'TEST10', 200000)).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when voucher expired', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ end_date: new Date('2020-01-01') }))
      mockVoucherRepository.findSavedVoucher.mockResolvedValue({ status: 'available' } as any)

      await expect(service.validateVoucher(userId, 'TEST10', 200000)).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when min order not met', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher())
      mockVoucherRepository.findSavedVoucher.mockResolvedValue({ status: 'available' } as any)

      await expect(service.validateVoucher(userId, 'TEST10', 50000)).rejects.toThrow(BusinessError)
    })

    it('throws ValidationError for invalid userId', async () => {
      await expect(service.validateVoucher('invalid-id', 'TEST10', 200000)).rejects.toThrow(ValidationError)
    })
  })

  describe('useVoucher', () => {
    const userId = new Types.ObjectId().toString()
    const voucherId = new Types.ObjectId().toString()

    it('calls markVoucherUsed and incrementUsedCount', async () => {
      mockVoucherRepository.markVoucherUsed.mockResolvedValue({} as any)
      mockVoucherRepository.incrementUsedCount.mockResolvedValue({} as any)

      await service.useVoucher(userId, voucherId, 'order123')

      expect(mockVoucherRepository.markVoucherUsed).toHaveBeenCalledWith(userId, voucherId, 'order123')
      expect(mockVoucherRepository.incrementUsedCount).toHaveBeenCalledWith(voucherId)
    })
  })

  describe('applyVoucher edge cases', () => {
    it('throws BusinessError when category restriction fails', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(
        createMockVoucher({ applicable_categories: [new Types.ObjectId()] })
      )

      await expect(
        service.applyVoucher({ code: 'TEST10', order_value: 200000, category_ids: ['other'] })
      ).rejects.toThrow(BusinessError)
    })

    it('throws ValidationError when code is empty', async () => {
      await expect(service.applyVoucher({ code: '', order_value: 200000 })).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when voucher is inactive', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ is_active: false }))

      await expect(service.applyVoucher({ code: 'TEST10', order_value: 200000 })).rejects.toThrow(NotFoundError)
    })
  })

  describe('getVoucherByCode edge cases', () => {
    it('throws ValidationError when code is empty', async () => {
      await expect(service.getVoucherByCode('')).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when voucher is inactive', async () => {
      mockVoucherRepository.findByCode.mockResolvedValue(createMockVoucher({ is_active: false }))

      await expect(service.getVoucherByCode('TEST10')).rejects.toThrow(NotFoundError)
    })
  })
})

