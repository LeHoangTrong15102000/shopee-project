/// <reference types="jest" />

const mockVoucherData = {
  _id: '507f1f77bcf86cd799439011',
  code: 'DISCOUNT10',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_value: 100,
  max_discount: 50,
  usage_limit: 100,
  used_count: 10,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  is_active: true,
}

const mockSavedVoucherData = {
  _id: '507f1f77bcf86cd799439020',
  user: '507f1f77bcf86cd799439012',
  voucher: mockVoucherData,
  status: 'available',
  saved_at: new Date(),
}

jest.mock('@database/models/voucher.model', () => {
  const mockModel: any = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.countDocuments = jest.fn()
  return { VoucherModel: mockModel }
})

jest.mock('@database/models/saved-voucher.model', () => {
  const mockModel: any = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.findOneAndUpdate = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.create = jest.fn()
  return { SavedVoucherModel: mockModel, VoucherStatus: {} }
})

import { VoucherModel } from '@database/models/voucher.model'
import { SavedVoucherModel } from '@database/models/saved-voucher.model'
import { VoucherRepository } from '../../repositories/voucher.repository'

describe('VoucherRepository', () => {
  let repository: VoucherRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new VoucherRepository()
  })

  describe('findAvailable', () => {
    it('should find available vouchers with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockVoucherData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(VoucherModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findAvailable({ page: 1, limit: 10 })

      expect(VoucherModel.find).toHaveBeenCalled()
      expect(result.data).toEqual([mockVoucherData])
      expect(result.pagination).toEqual({ page: 1, limit: 10, page_size: 1, total: 1 })
    })

    it('should filter by discount_type when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockVoucherData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(VoucherModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAvailable({ page: 1, limit: 10 }, { discount_type: 'percentage' })

      expect(VoucherModel.find).toHaveBeenCalled()
    })
  })

  describe('findByCode', () => {
    it('should find voucher by code', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockVoucherData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(VoucherModel.findOne as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findByCode('discount10')

      expect(VoucherModel.findOne).toHaveBeenCalledWith({ code: 'DISCOUNT10' })
      expect(result).toEqual(mockVoucherData)
    })
  })

  describe('findById', () => {
    it('should find voucher by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockVoucherData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(VoucherModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(VoucherModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockVoucherData)
    })
  })

  describe('incrementUsedCount', () => {
    it('should increment used count', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockVoucherData, used_count: 11 })
      ;(VoucherModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.incrementUsedCount('507f1f77bcf86cd799439011')

      expect(VoucherModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { $inc: { used_count: 1 } }, { new: true })
      expect(result?.used_count).toBe(11)
    })
  })

  describe('findSavedByUser', () => {
    it('should find saved vouchers by user', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockSavedVoucherData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(SavedVoucherModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(SavedVoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findSavedByUser('507f1f77bcf86cd799439012', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockSavedVoucherData])
    })
  })

  describe('findSavedVoucher', () => {
    it('should find saved voucher by user and voucher id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSavedVoucherData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findSavedVoucher('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011')

      expect(SavedVoucherModel.findOne).toHaveBeenCalled()
      expect(result).toEqual(mockSavedVoucherData)
    })
  })

  describe('saveVoucher', () => {
    it('should save a voucher for user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSavedVoucherData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.create as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439020' })
      ;(SavedVoucherModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.saveVoucher('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011')

      expect(SavedVoucherModel.create).toHaveBeenCalled()
      expect(result).toEqual(mockSavedVoucherData)
    })
  })

  describe('markVoucherUsed', () => {
    it('should mark voucher as used', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSavedVoucherData, status: 'used' })
      ;(SavedVoucherModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.markVoucherUsed('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011')

      expect(SavedVoucherModel.findOneAndUpdate).toHaveBeenCalled()
      expect(result?.status).toBe('used')
    })

    it('should mark voucher as used with order id', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSavedVoucherData, status: 'used' })
      ;(SavedVoucherModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      await repository.markVoucherUsed('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439030')

      expect(SavedVoucherModel.findOneAndUpdate).toHaveBeenCalled()
    })
  })

  describe('getCollectedVoucherIds', () => {
    it('should return collected voucher ids for user', async () => {
      const mockLean = jest.fn().mockResolvedValue([
        { voucher: { toString: () => '507f1f77bcf86cd799439011' } },
        { voucher: { toString: () => '507f1f77bcf86cd799439015' } },
      ])
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.find as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.getCollectedVoucherIds('507f1f77bcf86cd799439012')

      expect(result).toEqual(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439015'])
    })
  })
})

