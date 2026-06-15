import { Types } from 'mongoose'
import { IUser } from '../@types/models.type'
import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
} from '@repositories/interfaces/user.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, ConflictError } from './base.service'
import { hashValue, compareValue } from '@utils/crypt'
import { omitBy } from 'lodash'

export interface UpdateProfileDTO {
  email?: string
  password?: string
  new_password?: string
  address?: string
  date_of_birth?: Date
  name?: string
  phone?: string
  avatar?: string
}

// User profile cache with 5-minute TTL
const userProfileCache = new Map<string, { data: Omit<IUser, 'password'>; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedProfile(userId: string): Omit<IUser, 'password'> | null {
  const cached = userProfileCache.get(userId)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  userProfileCache.delete(userId)
  return null
}

function setCachedProfile(userId: string, data: Omit<IUser, 'password'>): void {
  userProfileCache.set(userId, { data, expiry: Date.now() + CACHE_TTL })
}

function invalidateProfileCache(userId: string): void {
  userProfileCache.delete(userId)
}

export class UserService extends BaseService {
  constructor(private readonly userRepository: IUserRepository) {
    super()
  }

  async createUser(data: CreateUserDTO): Promise<IUser> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new ConflictError('Email đã tồn tại')
    }

    const hashedPassword = hashValue(data.password)
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    })
  }

  async getUsers(pagination?: PaginationOptions): Promise<IUser[] | PaginatedResult<IUser>> {
    if (pagination) {
      return this.userRepository.findPaginated({}, this.normalizePagination(pagination))
    }
    return this.userRepository.find({})
  }

  async getUserById(userId: string): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    return user
  }

  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    // Check cache first
    const cachedProfile = getCachedProfile(userId)
    if (cachedProfile) {
      return cachedProfile
    }

    const profile = await this.userRepository.getProfile(userId)
    if (!profile) {
      throw new NotFoundError('User', userId)
    }

    // Store in cache
    setCachedProfile(userId, profile)
    return profile
  }

  async updateUser(userId: string, data: UpdateUserDTO): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const cleanData = omitBy(data, (value) => value === undefined || value === '')
    const user = await this.userRepository.updateById(userId, cleanData as UpdateUserDTO)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
    return user
  }

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const cleanData = omitBy(
      data,
      (value) => value === undefined || value === '',
    ) as UpdateProfileDTO

    // Handle password change
    if (cleanData.password) {
      const user = await this.userRepository.findByEmailWithPassword(
        (await this.userRepository.findById(userId))?.email || '',
      )
      if (!user) {
        throw new NotFoundError('User', userId)
      }

      const isPasswordValid = compareValue(cleanData.password, user.password)
      if (!isPasswordValid) {
        throw new ValidationError('Password không đúng', 'password')
      }

      if (!cleanData.new_password) {
        throw new ValidationError('New password is required', 'new_password')
      }

      cleanData.password = hashValue(cleanData.new_password)
      delete cleanData.new_password
    }

    const updateData: UpdateUserDTO = { ...cleanData }
    delete (updateData as UpdateProfileDTO).new_password

    const updatedUser = await this.userRepository.updateById(userId, updateData)
    if (!updatedUser) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
    return updatedUser
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.updateAvatar(userId, avatarPath)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
    return user
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.deleteById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
  }

  invalidateProfileCache(userId: string): void {
    invalidateProfileCache(userId)
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email)
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmailWithPassword(email)
  }

  async searchUsers(query: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
    return this.userRepository.search(query, this.normalizePagination(pagination))
  }
}
