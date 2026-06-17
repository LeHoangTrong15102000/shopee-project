import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'
import { IUser } from '../../@types/models.type'

/**
 * User creation data transfer object
 */
export interface CreateUserDTO {
  email: string
  password: string
  name?: string
  roles?: string[]
  date_of_birth?: Date
  address?: string
  phone?: string
  avatar?: string
  /** Whether this account has a user-chosen password (false for Google-OAuth accounts) */
  hasPassword?: boolean
}

/**
 * User update data transfer object
 */
export interface UpdateUserDTO {
  email?: string
  password?: string
  name?: string
  date_of_birth?: Date | string
  address?: string
  phone?: string
  avatar?: string
  roles?: string[]
  /** Timestamp of the last password change — used to invalidate pre-change access tokens */
  passwordChangedAt?: Date
}

/**
 * User filter options
 */
export interface UserFilterOptions {
  email?: string
  name?: string | RegExp
  roles?: string[]
}

/**
 * User repository interface extending base repository
 */
export interface IUserRepository extends IBaseRepository<IUser, CreateUserDTO, UpdateUserDTO> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<IUser | null>

  /**
   * Find user by email with password (for authentication)
   */
  findByEmailWithPassword(email: string): Promise<IUser | null>

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>

  /**
   * Find users by role
   */
  findByRole(role: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>>

  /**
   * Update user password. When setHasPassword is true (default), also sets hasPassword: true
   * so both the set-password and reset-password paths correctly flip the flag.
   */
  updatePassword(
    userId: string | Types.ObjectId,
    hashedPassword: string,
    setHasPassword?: boolean,
  ): Promise<boolean>

  /**
   * Update user avatar
   */
  updateAvatar(userId: string | Types.ObjectId, avatarPath: string): Promise<IUser | null>

  /**
   * Get user profile (without sensitive data)
   */
  getProfile(userId: string | Types.ObjectId): Promise<Omit<IUser, 'password'> | null>

  /**
   * Search users by name or email
   */
  search(query: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>>
}
