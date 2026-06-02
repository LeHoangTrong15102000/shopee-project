/// <reference types="jest" />
import { Types } from 'mongoose'
import { AddressService } from '@services/address.service'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { NotFoundError, BusinessError, ValidationError } from '@services/base.service'

describe('AddressService', () => {
  const validObjectId = new Types.ObjectId()
  const mockAddress = {
    _id: validObjectId,
    user: validObjectId,
    full_name: 'Test',
    phone: '0123456789',
    province: 'HCM',
    district: 'Q1',
    ward: 'P1',
    street: '123 ABC',
    is_default: false,
  }

  const mockAddressRepository = {
    findByUser: jest.fn(),
    findByIdAndUser: jest.fn(),
    findDefaultAddress: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    setAsDefault: jest.fn(),
    clearDefaultFlags: jest.fn(),
    countByUser: jest.fn(),
    deleteByIdAndUser: jest.fn(),
  } as unknown as jest.Mocked<IAddressRepository>

  let addressService: AddressService

  beforeEach(() => {
    jest.clearAllMocks()
    addressService = new AddressService(mockAddressRepository)
  })

  describe('getAddresses', () => {
    it('should return addresses with total', async () => {
      mockAddressRepository.findByUser.mockResolvedValue([mockAddress] as any)
      const result = await addressService.getAddresses(validObjectId.toString())
      expect(result).toEqual({ addresses: [mockAddress], total: 1 })
      expect(mockAddressRepository.findByUser).toHaveBeenCalledWith(validObjectId.toString())
    })
  })

  describe('getAddressById', () => {
    it('should return address when found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      const result = await addressService.getAddressById(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result).toEqual(mockAddress)
    })

    it('should throw NotFoundError when not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        addressService.getAddressById(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('createAddress', () => {
    it('should clear other defaults when is_default is true', async () => {
      const data = { ...mockAddress, is_default: true }
      mockAddressRepository.countByUser.mockResolvedValue(1)
      mockAddressRepository.create.mockResolvedValue(data)
      await addressService.createAddress(validObjectId.toString(), data)
      expect(mockAddressRepository.clearDefaultFlags).toHaveBeenCalledWith(validObjectId.toString())
    })

    it('should auto-set as default for first address', async () => {
      mockAddressRepository.countByUser.mockResolvedValue(0)
      mockAddressRepository.create.mockResolvedValue({ ...mockAddress, is_default: true })
      await addressService.createAddress(validObjectId.toString(), mockAddress)
      expect(mockAddressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_default: true }),
      )
    })
  })

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.updateById.mockResolvedValue({ ...mockAddress, full_name: 'Updated' })
      const result = await addressService.updateAddress(
        validObjectId.toString(),
        validObjectId.toString(),
        { full_name: 'Updated' },
      )
      expect(result.full_name).toBe('Updated')
    })

    it('should clear other defaults when setting as default', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.updateById.mockResolvedValue({ ...mockAddress, is_default: true })
      await addressService.updateAddress(validObjectId.toString(), validObjectId.toString(), {
        is_default: true,
      })
      expect(mockAddressRepository.clearDefaultFlags).toHaveBeenCalled()
    })

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        addressService.updateAddress(validObjectId.toString(), validObjectId.toString(), {}),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteAddress', () => {
    it('should delete non-default address successfully', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.deleteByIdAndUser.mockResolvedValue(mockAddress as any)
      await addressService.deleteAddress(validObjectId.toString(), validObjectId.toString())
      expect(mockAddressRepository.deleteByIdAndUser).toHaveBeenCalled()
    })

    it('should throw BusinessError when deleting default with others existing', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue({ ...mockAddress, is_default: true })
      mockAddressRepository.countByUser.mockResolvedValue(2)
      await expect(
        addressService.deleteAddress(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('setDefaultAddress', () => {
    it('should set address as default successfully', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.setAsDefault.mockResolvedValue({ ...mockAddress, is_default: true })
      const result = await addressService.setDefaultAddress(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.is_default).toBe(true)
      expect(mockAddressRepository.setAsDefault).toHaveBeenCalledWith(
        validObjectId.toString(),
        validObjectId.toString(),
      )
    })

    it('should throw NotFoundError when address not found on setDefault', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        addressService.setDefaultAddress(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when setAsDefault returns null', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.setAsDefault.mockResolvedValue(null)
      await expect(
        addressService.setDefaultAddress(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getDefaultAddress', () => {
    it('should return default address', async () => {
      const defaultAddress = { ...mockAddress, is_default: true }
      mockAddressRepository.findDefaultAddress.mockResolvedValue(defaultAddress)
      const result = await addressService.getDefaultAddress(validObjectId.toString())
      expect(result).toEqual(defaultAddress)
    })

    it('should return null when no default address', async () => {
      mockAddressRepository.findDefaultAddress.mockResolvedValue(null)
      const result = await addressService.getDefaultAddress(validObjectId.toString())
      expect(result).toBeNull()
    })

    it('should throw ValidationError for invalid userId', async () => {
      await expect(addressService.getDefaultAddress('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getAddresses - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(addressService.getAddresses('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getAddressById - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        addressService.getAddressById('invalid', validObjectId.toString()),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid addressId', async () => {
      await expect(
        addressService.getAddressById(validObjectId.toString(), 'invalid'),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        addressService.getAddressById(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('createAddress - default when first address', () => {
    it('should make first address default regardless of is_default flag', async () => {
      mockAddressRepository.countByUser.mockResolvedValue(0)
      mockAddressRepository.create.mockResolvedValue({ ...mockAddress, is_default: true })

      await addressService.createAddress(validObjectId.toString(), {
        ...mockAddress,
        is_default: false,
      })
      expect(mockAddressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_default: true }),
      )
    })
  })

  describe('updateAddress - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        addressService.updateAddress('invalid', validObjectId.toString(), {}),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid addressId', async () => {
      await expect(
        addressService.updateAddress(validObjectId.toString(), 'invalid', {}),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError when address not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        addressService.updateAddress(validObjectId.toString(), validObjectId.toString(), {}),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when updateById returns null', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress)
      mockAddressRepository.updateById.mockResolvedValue(null)
      await expect(
        addressService.updateAddress(validObjectId.toString(), validObjectId.toString(), {}),
      ).rejects.toThrow(NotFoundError)
    })

    it('should clear defaults when setting new default', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue({ ...mockAddress, is_default: false })
      mockAddressRepository.clearDefaultFlags.mockResolvedValue(0)
      mockAddressRepository.updateById.mockResolvedValue({ ...mockAddress, is_default: true })

      await addressService.updateAddress(validObjectId.toString(), validObjectId.toString(), {
        is_default: true,
      })
      expect(mockAddressRepository.clearDefaultFlags).toHaveBeenCalled()
    })
  })

  describe('deleteAddress - error paths', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        addressService.deleteAddress('invalid', validObjectId.toString()),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid addressId', async () => {
      await expect(
        addressService.deleteAddress(validObjectId.toString(), 'invalid'),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw BusinessError when trying to delete only default address', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue({ ...mockAddress, is_default: true })
      mockAddressRepository.countByUser.mockResolvedValue(2)

      const { BusinessError } = await import('@services/base.service')
      await expect(
        addressService.deleteAddress(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })
})
