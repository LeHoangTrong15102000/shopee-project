import { Types } from 'mongoose'
import { IBaseRepository } from './base.repository.interface'

/**
 * Address interface
 */
export interface IAddressItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  full_name: string
  phone: string
  province: string
  province_id?: string
  district: string
  district_id?: string
  ward: string
  ward_id?: string
  street: string
  is_default: boolean
  address_type?: string
  label?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Address creation DTO
 */
export interface CreateAddressDTO {
  user: Types.ObjectId | string
  full_name: string
  phone: string
  province: string
  province_id?: string
  district: string
  district_id?: string
  ward: string
  ward_id?: string
  street: string
  is_default?: boolean
  address_type?: string
  label?: string
}

/**
 * Address update DTO
 */
export interface UpdateAddressDTO {
  full_name?: string
  phone?: string
  province?: string
  province_id?: string
  district?: string
  district_id?: string
  ward?: string
  ward_id?: string
  street?: string
  is_default?: boolean
  address_type?: string
  label?: string
}

/**
 * Address repository interface
 */
export interface IAddressRepository extends IBaseRepository<
  IAddressItem,
  CreateAddressDTO,
  UpdateAddressDTO
> {
  /**
   * Find all addresses for a user
   */
  findByUser(userId: string | Types.ObjectId): Promise<IAddressItem[]>

  /**
   * Find user's default address
   */
  findDefaultAddress(userId: string | Types.ObjectId): Promise<IAddressItem | null>

  /**
   * Find address by ID and user
   */
  findByIdAndUser(
    addressId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IAddressItem | null>

  /**
   * Set address as default (unsets others)
   */
  setAsDefault(
    userId: string | Types.ObjectId,
    addressId: string | Types.ObjectId,
  ): Promise<IAddressItem | null>

  /**
   * Clear default flag for all user addresses
   */
  clearDefaultFlags(userId: string | Types.ObjectId): Promise<number>

  /**
   * Count user's addresses
   */
  countByUser(userId: string | Types.ObjectId): Promise<number>

  /**
   * Delete address by ID and user
   */
  deleteByIdAndUser(
    addressId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IAddressItem | null>
}
