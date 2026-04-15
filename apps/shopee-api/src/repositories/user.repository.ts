import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { UserModel } from '@database/models/user.model'
import { IUser } from '../@types/models.type'
import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
} from './interfaces/user.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class UserRepository implements IUserRepository {
  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return UserModel.findById(id).select({ password: 0 }).lean<IUser | null>()
  }

  async findOne(filter: FilterQuery<IUser>): Promise<IUser | null> {
    return UserModel.findOne(filter).select({ password: 0 }).lean<IUser | null>()
  }

  async find(filter: FilterQuery<IUser>, options?: QueryOptions): Promise<IUser[]> {
    return UserModel.find(filter, null, options).select({ password: 0 }).lean<IUser[]>()
  }

  async findPaginated(
    filter: FilterQuery<IUser>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<IUser>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      UserModel.find(filter)
        .select({ password: 0 })
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IUser[]>(),
      UserModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async create(data: CreateUserDTO): Promise<IUser> {
    const user = new UserModel(data)
    const saved = await user.save()
    const result = saved.toObject() as IUser
    delete (result as Partial<IUser>).password
    return result
  }

  async updateById(id: string | Types.ObjectId, data: UpdateUserDTO): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true })
      .select({ password: 0 })
      .lean<IUser | null>()
  }

  async updateMany(filter: FilterQuery<IUser>, data: UpdateQuery<IUser>): Promise<number> {
    const result = await UserModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<IUser | null> {
    return UserModel.findByIdAndDelete(id).select({ password: 0 }).lean<IUser | null>()
  }

  async deleteMany(filter: FilterQuery<IUser>): Promise<number> {
    const result = await UserModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<IUser>): Promise<number> {
    return UserModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    const doc = await UserModel.exists(filter)
    return doc !== null
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).select({ password: 0 }).lean<IUser | null>()
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).lean<IUser | null>()
  }

  async emailExists(email: string): Promise<boolean> {
    const doc = await UserModel.exists({ email })
    return doc !== null
  }

  async findByRole(role: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
    return this.findPaginated({ roles: role }, pagination)
  }

  async updatePassword(userId: string | Types.ObjectId, hashedPassword: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: new Types.ObjectId(userId.toString()) },
      { password: hashedPassword },
    )
    return result.modifiedCount > 0
  }

  async updateAvatar(userId: string | Types.ObjectId, avatarPath: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true })
      .select({ password: 0 })
      .lean<IUser | null>()
  }

  async getProfile(userId: string | Types.ObjectId): Promise<Omit<IUser, 'password'> | null> {
    return UserModel.findById(userId)
      .select({ password: 0, __v: 0 })
      .lean<Omit<IUser, 'password'> | null>()
  }

  async search(query: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
    const regex = new RegExp(query, 'i')
    return this.findPaginated({ $or: [{ name: regex }, { email: regex }] }, pagination)
  }
}
