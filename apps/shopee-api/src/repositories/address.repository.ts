import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { AddressModel, IAddress } from '@database/models/address.model'
import {
  IAddressRepository,
  IAddressItem,
  CreateAddressDTO,
  UpdateAddressDTO,
} from './interfaces/address.repository.interface'
import { PaginationOptions, PaginatedResult } from './interfaces/base.repository.interface'

export class AddressRepository implements IAddressRepository {
  async findById(id: string | Types.ObjectId): Promise<IAddressItem | null> {
    return AddressModel.findById(id).lean<IAddressItem | null>()
  }

  async findOne(filter: FilterQuery<IAddress>): Promise<IAddressItem | null> {
    return AddressModel.findOne(filter).lean<IAddressItem | null>()
  }

  async find(filter: FilterQuery<IAddress>, options?: QueryOptions): Promise<IAddressItem[]> {
    return AddressModel.find(filter, null, options).lean<IAddressItem[]>()
  }

  async findPaginated(filter: FilterQuery<IAddress>, options: PaginationOptions): Promise<PaginatedResult<IAddressItem>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      AddressModel.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IAddressItem[]>(),
      AddressModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit),
        total,
      },
    }
  }

  async create(data: CreateAddressDTO): Promise<IAddressItem> {
    const address = new AddressModel(data)
    const saved = await address.save()
    return saved.toObject() as IAddressItem
  }

  async updateById(id: string | Types.ObjectId, data: UpdateAddressDTO): Promise<IAddressItem | null> {
    return AddressModel.findByIdAndUpdate(id, data, { new: true }).lean<IAddressItem | null>()
  }

  async updateMany(filter: FilterQuery<IAddress>, data: UpdateQuery<IAddress>): Promise<number> {
    const result = await AddressModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IAddressItem | null> {
    return AddressModel.findByIdAndDelete(id).lean<IAddressItem | null>()
  }

  async deleteMany(filter: FilterQuery<IAddress>): Promise<number> {
    const result = await AddressModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IAddress>): Promise<number> {
    return AddressModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IAddress>): Promise<boolean> {
    const doc = await AddressModel.exists(filter)
    return doc !== null
  }

  async findByUser(userId: string | Types.ObjectId): Promise<IAddressItem[]> {
    return AddressModel.find({ user: new Types.ObjectId(userId.toString()) })
      .sort({ is_default: -1, createdAt: -1 })
      .lean<IAddressItem[]>()
  }

  async findDefaultAddress(userId: string | Types.ObjectId): Promise<IAddressItem | null> {
    return AddressModel.findOne({
      user: new Types.ObjectId(userId.toString()),
      is_default: true,
    }).lean<IAddressItem | null>()
  }

  async findByIdAndUser(addressId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IAddressItem | null> {
    return AddressModel.findOne({
      _id: new Types.ObjectId(addressId.toString()),
      user: new Types.ObjectId(userId.toString()),
    }).lean<IAddressItem | null>()
  }

  async setAsDefault(userId: string | Types.ObjectId, addressId: string | Types.ObjectId): Promise<IAddressItem | null> {
    const userObjectId = new Types.ObjectId(userId.toString())
    const addressObjectId = new Types.ObjectId(addressId.toString())

    // Clear all default flags
    await AddressModel.updateMany({ user: userObjectId }, { is_default: false })

    // Set the specified address as default
    return AddressModel.findOneAndUpdate(
      { _id: addressObjectId, user: userObjectId },
      { is_default: true },
      { new: true }
    ).lean<IAddressItem | null>()
  }

  async clearDefaultFlags(userId: string | Types.ObjectId): Promise<number> {
    const result = await AddressModel.updateMany(
      { user: new Types.ObjectId(userId.toString()) },
      { is_default: false }
    )
    return result.modifiedCount
  }

  async countByUser(userId: string | Types.ObjectId): Promise<number> {
    return AddressModel.countDocuments({ user: new Types.ObjectId(userId.toString()) })
  }

  async deleteByIdAndUser(addressId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IAddressItem | null> {
    return AddressModel.findOneAndDelete({
      _id: new Types.ObjectId(addressId.toString()),
      user: new Types.ObjectId(userId.toString()),
    }).lean<IAddressItem | null>()
  }
}

