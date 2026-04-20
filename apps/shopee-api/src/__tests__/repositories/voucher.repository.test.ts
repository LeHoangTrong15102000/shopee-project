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
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.create = jest.fn()
  mockModel.aggregate = jest.fn()
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

      expect(VoucherModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $inc: { used_count: 1 } },
        { new: true },
      )
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

      const result = await repository.findSavedByUser('507f1f77bcf86cd799439012', {
        page: 1,
        limit: 10,
      })

      expect(result.data).toEqual([mockSavedVoucherData])
    })
  })

  describe('findSavedVoucher', () => {
    it('should find saved voucher by user and voucher id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSavedVoucherData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findSavedVoucher(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(SavedVoucherModel.findOne).toHaveBeenCalled()
      expect(result).toEqual(mockSavedVoucherData)
    })
  })

  describe('saveVoucher', () => {
    it('should save a voucher for user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSavedVoucherData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.create as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439020',
      })
      ;(SavedVoucherModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.saveVoucher(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(SavedVoucherModel.create).toHaveBeenCalled()
      expect(result).toEqual(mockSavedVoucherData)
    })
  })

  describe('markVoucherUsed', () => {
    it('should mark voucher as used', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSavedVoucherData, status: 'used' })
      ;(SavedVoucherModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.markVoucherUsed(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(SavedVoucherModel.findOneAndUpdate).toHaveBeenCalled()
      expect(result?.status).toBe('used')
    })

    it('should mark voucher as used with order id', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSavedVoucherData, status: 'used' })
      ;(SavedVoucherModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      await repository.markVoucherUsed(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439030',
      )

      expect(SavedVoucherModel.findOneAndUpdate).toHaveBeenCalled()
    })
  })

  describe('getCollectedVoucherIds', () => {
    it('should return collected voucher ids for user', async () => {
      const mockLean = jest
        .fn()
        .mockResolvedValue([
          { voucher: { toString: () => '507f1f77bcf86cd799439011' } },
          { voucher: { toString: () => '507f1f77bcf86cd799439015' } },
        ])
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(SavedVoucherModel.find as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.getCollectedVoucherIds('507f1f77bcf86cd799439012')

      expect(result).toEqual(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439015'])
    })
  })

  // ─── Admin Methods ─────────────────────────────────────────────────────────

  describe('findAllWithFilters', () => {
    const buildFindChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(VoucherModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
    }

    it('should return paginated vouchers with no filters', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findAllWithFilters({}, { page: 1, limit: 10 })

      expect(VoucherModel.find).toHaveBeenCalledWith({})
      expect(result.data).toEqual([mockVoucherData])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by is_active = "true"', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAllWithFilters({ is_active: 'true' }, { page: 1, limit: 10 })

      expect(VoucherModel.find).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }))
    })

    it('should filter by is_active = "false"', async () => {
      buildFindChain([])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await repository.findAllWithFilters({ is_active: 'false' }, { page: 1, limit: 10 })

      expect(VoucherModel.find).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }))
    })

    it('should filter by discount_type', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAllWithFilters({ discount_type: 'percentage' }, { page: 1, limit: 10 })

      expect(VoucherModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ discount_type: 'percentage' }),
      )
    })

    it('should filter by search (code regex)', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAllWithFilters({ search: 'DISC' }, { page: 1, limit: 10 })

      const callArgs = (VoucherModel.find as jest.Mock).mock.calls[0][0]
      expect(callArgs.code).toBeInstanceOf(RegExp)
    })

    it('should apply status = "active" filter', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAllWithFilters({ status: 'active' }, { page: 1, limit: 10 })

      const callArgs = (VoucherModel.find as jest.Mock).mock.calls[0][0]
      expect(callArgs.is_active).toBe(true)
      expect(callArgs.start_date).toBeDefined()
      expect(callArgs.end_date).toBeDefined()
    })

    it('should apply status = "expired" filter', async () => {
      buildFindChain([])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await repository.findAllWithFilters({ status: 'expired' }, { page: 1, limit: 10 })

      const callArgs = (VoucherModel.find as jest.Mock).mock.calls[0][0]
      expect(callArgs.end_date).toBeDefined()
    })

    it('should apply status = "upcoming" filter', async () => {
      buildFindChain([])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await repository.findAllWithFilters({ status: 'upcoming' }, { page: 1, limit: 10 })

      const callArgs = (VoucherModel.find as jest.Mock).mock.calls[0][0]
      expect(callArgs.start_date).toBeDefined()
    })

    it('should apply status = "used_up" filter', async () => {
      buildFindChain([])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await repository.findAllWithFilters({ status: 'used_up' }, { page: 1, limit: 10 })

      const callArgs = (VoucherModel.find as jest.Mock).mock.calls[0][0]
      expect(callArgs.$expr).toBeDefined()
    })

    it('should apply custom sort_by and order asc', async () => {
      buildFindChain([mockVoucherData])
      ;(VoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findAllWithFilters(
        {},
        { page: 1, limit: 10, sort_by: 'used_count', order: 'asc' },
      )

      expect(VoucherModel.find).toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should create a voucher and return it with lean', async () => {
      const createdId = '507f1f77bcf86cd799439099'
      ;(VoucherModel.create as jest.Mock).mockResolvedValue({ _id: createdId })

      const mockLean = jest.fn().mockResolvedValue(mockVoucherData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(VoucherModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.create({
        code: 'DISCOUNT10',
        discount_type: 'percentage',
        discount_value: 10,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      })

      expect(VoucherModel.create).toHaveBeenCalled()
      expect(VoucherModel.findById).toHaveBeenCalledWith(createdId)
      expect(result).toEqual(mockVoucherData)
    })
  })

  describe('updateById', () => {
    it('should update voucher and return updated doc', async () => {
      const updated = { ...mockVoucherData, discount_value: 20 }
      const mockLean = jest.fn().mockResolvedValue(updated)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(VoucherModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.updateById('507f1f77bcf86cd799439011', {
        discount_value: 20,
      })

      expect(VoucherModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { discount_value: 20 },
        { new: true },
      )
      expect(result.discount_value).toBe(20)
    })

    it('should convert start_date and end_date strings to Date objects', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockVoucherData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(VoucherModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect })

      await repository.updateById('507f1f77bcf86cd799439011', {
        start_date: '2024-06-01',
        end_date: '2024-12-31',
      })

      const callArgs = (VoucherModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1]
      expect(callArgs.start_date).toBeInstanceOf(Date)
      expect(callArgs.end_date).toBeInstanceOf(Date)
    })
  })

  describe('deleteById', () => {
    it('should call findByIdAndDelete with the given id', async () => {
      ;(VoucherModel.findByIdAndDelete as jest.Mock).mockResolvedValue(undefined)

      await repository.deleteById('507f1f77bcf86cd799439011')

      expect(VoucherModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    })
  })

  describe('getUsageStats', () => {
    it('should return paginated usage stats for a voucher', async () => {
      const mockUsageData = [{ ...mockSavedVoucherData, status: 'used' }]
      const mockLean = jest.fn().mockResolvedValue(mockUsageData)
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(SavedVoucherModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(SavedVoucherModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.getUsageStats('507f1f77bcf86cd799439011', {
        page: 1,
        limit: 10,
      })

      expect(SavedVoucherModel.find).toHaveBeenCalled()
      expect(result.data).toEqual(mockUsageData)
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('getOverviewStats', () => {
    it('should return overview stats with counts and total_used', async () => {
      ;(VoucherModel.countDocuments as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30)  // active
        .mockResolvedValueOnce(20)  // expired
        .mockResolvedValueOnce(5)   // upcoming
      ;(VoucherModel.aggregate as jest.Mock).mockResolvedValue([{ total: 500 }])

      const result = await repository.getOverviewStats()

      expect(result.total).toBe(100)
      expect(result.active).toBe(30)
      expect(result.expired).toBe(20)
      expect(result.total_used).toBe(500)
    })

    it('should return total_used = 0 when aggregate returns empty array', async () => {
      ;(VoucherModel.countDocuments as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
      ;(VoucherModel.aggregate as jest.Mock).mockResolvedValue([])

      const result = await repository.getOverviewStats()

      expect(result.total_used).toBe(0)
    })
  })
})
