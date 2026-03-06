import { Types } from 'mongoose'
import {
  IAddressRepository,
  IAddressItem,
  CreateAddressDTO,
  UpdateAddressDTO,
} from '@repositories/interfaces/address.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'

export class AddressService extends BaseService {
  constructor(private readonly addressRepository: IAddressRepository) {
    super()
  }

  async getAddresses(userId: string): Promise<{ addresses: IAddressItem[]; total: number }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const addresses = await this.addressRepository.findByUser(userId)
    return { addresses, total: addresses.length }
  }

  async getAddressById(userId: string, addressId: string): Promise<IAddressItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(addressId)) {
      throw new ValidationError('Invalid address ID format')
    }

    const address = await this.addressRepository.findByIdAndUser(addressId, userId)
    if (!address) {
      throw new NotFoundError('Address', addressId)
    }
    return address
  }

  async createAddress(
    userId: string,
    data: Omit<CreateAddressDTO, 'user'>
  ): Promise<IAddressItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    // If setting as default, clear other defaults
    if (data.is_default) {
      await this.addressRepository.clearDefaultFlags(userId)
    }

    // If first address, make it default
    const addressCount = await this.addressRepository.countByUser(userId)
    const shouldBeDefault = data.is_default || addressCount === 0

    return this.addressRepository.create({
      ...data,
      user: new Types.ObjectId(userId),
      is_default: shouldBeDefault,
    })
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressDTO
  ): Promise<IAddressItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(addressId)) {
      throw new ValidationError('Invalid address ID format')
    }

    const address = await this.addressRepository.findByIdAndUser(addressId, userId)
    if (!address) {
      throw new NotFoundError('Address', addressId)
    }

    // If setting as default, clear other defaults
    if (data.is_default && !address.is_default) {
      await this.addressRepository.clearDefaultFlags(userId)
    }

    const updated = await this.addressRepository.updateById(addressId, data)
    if (!updated) {
      throw new NotFoundError('Address', addressId)
    }
    return updated
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(addressId)) {
      throw new ValidationError('Invalid address ID format')
    }

    const address = await this.addressRepository.findByIdAndUser(addressId, userId)
    if (!address) {
      throw new NotFoundError('Address', addressId)
    }

    // Prevent deleting default address if other addresses exist
    if (address.is_default) {
      const otherCount = await this.addressRepository.countByUser(userId)
      if (otherCount > 1) {
        throw new BusinessError('Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.')
      }
    }

    await this.addressRepository.deleteByIdAndUser(addressId, userId)
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<IAddressItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(addressId)) {
      throw new ValidationError('Invalid address ID format')
    }

    const address = await this.addressRepository.findByIdAndUser(addressId, userId)
    if (!address) {
      throw new NotFoundError('Address', addressId)
    }

    const updated = await this.addressRepository.setAsDefault(userId, addressId)
    if (!updated) {
      throw new NotFoundError('Address', addressId)
    }
    return updated
  }

  async getDefaultAddress(userId: string): Promise<IAddressItem | null> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.addressRepository.findDefaultAddress(userId)
  }
}

