/// <reference types="jest" />

import { Types } from 'mongoose'

const mockAddressData = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  street: '123 Main St',
  is_default: true,
  toObject: () => mockAddressData,
}

jest.mock('@database/models/address.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOne = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
      lean: jest.fn(),
    }),
    lean: jest.fn(),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOneAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  return { AddressModel: mockModel }
})

import { AddressModel } from '@database/models/address.model'
import { AddressRepository } from '@repositories/address.repository'

describe('AddressRepository', () => {
  let repository: AddressRepository
  const mockId = '507f1f77bcf86cd799439011'
  const mockUserId = '507f1f77bcf86cd799439012'
  const mockAddress = { _id: mockId, user: mockUserId, street: '123 Main St', is_default: true }

  beforeEach(() => {
    jest.clearAllMocks()
    // Re-setup constructor mock after clearAllMocks
    ;(AddressModel as any).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockAddressData }),
    }))
    repository = new AddressRepository()
  })

  describe('findById', () => {
    it('should find address by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findById(mockId)
      expect(AddressModel.findById).toHaveBeenCalledWith(mockId)
      expect(result).toEqual(mockAddress)
    })
  })

  describe('findOne', () => {
    it('should find one address by filter', async () => {
      const filter = { user: mockUserId }
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findOne(filter)
      expect(AddressModel.findOne).toHaveBeenCalledWith(filter)
      expect(result).toEqual(mockAddress)
    })
  })

  describe('find', () => {
    it('should find addresses by filter', async () => {
      const filter = { user: mockUserId }
      const mockLean = jest.fn().mockResolvedValue([mockAddress])
      ;(AddressModel.find as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.find(filter)
      expect(AddressModel.find).toHaveBeenCalledWith(filter, null, undefined)
      expect(result).toEqual([mockAddress])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated addresses', async () => {
      const filter = { user: mockUserId }
      const mockLean = jest.fn().mockResolvedValue([mockAddress])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(AddressModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(AddressModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findPaginated(filter, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockAddress])
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('create', () => {
    it('should create a new address', async () => {
      const result = await repository.create({ user: mockUserId, street: '123 Main St' } as any)
      expect(result).toEqual(mockAddressData)
    })
  })

  describe('updateById', () => {
    it('should update address by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.updateById(mockId, { street: 'New St' })
      expect(AddressModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        { street: 'New St' },
        { new: true },
      )
      expect(result).toEqual(mockAddress)
    })
  })

  describe('deleteById', () => {
    it('should delete address by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.deleteById(mockId)
      expect(AddressModel.findByIdAndDelete).toHaveBeenCalledWith(mockId)
      expect(result).toEqual(mockAddress)
    })
  })

  describe('count', () => {
    it('should count addresses', async () => {
      ;(AddressModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ user: mockUserId })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should check if address exists', async () => {
      ;(AddressModel.exists as jest.Mock).mockResolvedValue({ _id: mockId })
      const result = await repository.exists({ _id: mockId })
      expect(result).toBe(true)
    })
  })

  describe('findByUser', () => {
    it('should find addresses by user', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockAddress])
      const mockSort = jest.fn().mockReturnValue({ lean: mockLean })
      ;(AddressModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      const result = await repository.findByUser(mockUserId)
      expect(result).toEqual([mockAddress])
    })
  })

  describe('findDefaultAddress', () => {
    it('should find default address', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findDefaultAddress(mockUserId)
      expect(result).toEqual(mockAddress)
    })
  })

  describe('findByIdAndUser', () => {
    it('should find address by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findByIdAndUser(mockId, mockUserId)
      expect(result).toEqual(mockAddress)
    })
  })

  describe('setAsDefault', () => {
    it('should set address as default', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 })
      ;(AddressModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.setAsDefault(mockUserId, mockId)
      expect(AddressModel.updateMany).toHaveBeenCalled()
      expect(result).toEqual(mockAddress)
    })
  })

  describe('clearDefaultFlags', () => {
    it('should clear default flags', async () => {
      ;(AddressModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 })
      const result = await repository.clearDefaultFlags(mockUserId)
      expect(result).toBe(2)
    })
  })

  describe('countByUser', () => {
    it('should count addresses by user', async () => {
      ;(AddressModel.countDocuments as jest.Mock).mockResolvedValue(3)
      const result = await repository.countByUser(mockUserId)
      expect(result).toBe(3)
    })
  })

  describe('deleteByIdAndUser', () => {
    it('should delete address by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockAddress)
      ;(AddressModel.findOneAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.deleteByIdAndUser(mockId, mockUserId)
      expect(result).toEqual(mockAddress)
    })
  })
})
