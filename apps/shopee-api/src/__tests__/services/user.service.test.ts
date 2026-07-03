/**
 * Unit Tests for UserService
 * Tests user CRUD operations and profile management
 */

/// <reference types="jest" />
import { UserService, UpdateProfileDTO } from '@services/user.service'
import { NotFoundError, ValidationError, ConflictError } from '@services/base.service'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { Types } from 'mongoose'

// Mock dependencies
jest.mock('@utils/crypt', () => ({
  hashValue: jest.fn((value: string) => `hashed_${value}`),
  compareValue: jest.fn(),
}))

import { hashValue, compareValue } from '@utils/crypt'

describe('UserService', () => {
  let userService: UserService
  let mockUserRepository: jest.Mocked<IUserRepository>

  const validObjectId = new Types.ObjectId().toString()
  const mockUser = {
    _id: new Types.ObjectId(validObjectId),
    email: 'test@example.com',
    password: 'hashed_password123',
    roles: ['User'],
    name: 'Test User',
    phone: '0123456789',
    address: 'Test Address',
  }

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      emailExists: jest.fn(),
      updatePassword: jest.fn(),
      updateAvatar: jest.fn(),
      getProfile: jest.fn(),
      search: jest.fn(),
      findByRole: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>

    userService = new UserService(mockUserRepository)
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false)
      mockUserRepository.create.mockResolvedValue(mockUser as any)

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        roles: ['User'],
      })

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith('test@example.com')
      expect(hashValue).toHaveBeenCalledWith('password123')
      expect(result.email).toBe('test@example.com')
    })

    it('should throw ConflictError if email exists', async () => {
      mockUserRepository.emailExists.mockResolvedValue(true)

      await expect(
        userService.createUser({
          email: 'existing@example.com',
          password: 'password123',
          roles: ['User'],
        }),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)

      const result = await userService.getUserById(validObjectId)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(validObjectId)
      expect(result.email).toBe('test@example.com')
    })

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(userService.getUserById(validObjectId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(userService.getUserById('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const profileWithoutPassword = { ...mockUser, password: undefined }
      mockUserRepository.getProfile.mockResolvedValue(profileWithoutPassword as any)

      const result = await userService.getProfile(validObjectId)

      expect(mockUserRepository.getProfile).toHaveBeenCalledWith(validObjectId)
      expect(result.email).toBe('test@example.com')
    })

    it('should throw NotFoundError when profile not found', async () => {
      const anotherValidId = new Types.ObjectId().toString()
      mockUserRepository.getProfile.mockResolvedValue(null)

      await expect(userService.getProfile(anotherValidId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser, name: 'Updated Name' } as any)

      const result = await userService.updateUser(validObjectId, { name: 'Updated Name' })

      expect(mockUserRepository.updateById).toHaveBeenCalled()
      expect(result.name).toBe('Updated Name')
    })

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.updateById.mockResolvedValue(null)

      await expect(userService.updateUser(validObjectId, { name: 'Updated' })).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('updateProfile', () => {
    it('should update profile with password change', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser, name: 'Updated' } as any)
      ;(compareValue as jest.Mock).mockReturnValue(true)

      const result = await userService.updateProfile(validObjectId, {
        password: 'oldpassword',
        new_password: 'newpassword',
      })

      expect(hashValue).toHaveBeenCalledWith('newpassword')
      expect(result).toBeDefined()
    })

    it('should throw ValidationError with wrong current password', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      ;(compareValue as jest.Mock).mockReturnValue(false)

      await expect(
        userService.updateProfile(validObjectId, {
          password: 'wrongpassword',
          new_password: 'newpassword',
        }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.deleteById.mockResolvedValue(mockUser as any)

      await userService.deleteUser(validObjectId)

      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(validObjectId)
    })

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.deleteById.mockResolvedValue(null)

      await expect(userService.deleteUser(validObjectId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('getUsers', () => {
    it('should return all users without pagination', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser] as any)

      const result = await userService.getUsers()

      expect(mockUserRepository.find).toHaveBeenCalledWith({})
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return paginated users with pagination', async () => {
      const paginatedResult = {
        data: [mockUser],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockUserRepository.findPaginated.mockResolvedValue(paginatedResult as any)

      const result = await userService.getUsers({ page: 1, limit: 10 })

      expect(mockUserRepository.findPaginated).toHaveBeenCalled()
      expect((result as any).pagination).toBeDefined()
    })
  })

  describe('updateAvatar', () => {
    it('should update avatar successfully', async () => {
      mockUserRepository.updateAvatar.mockResolvedValue({
        ...mockUser,
        avatar: 'new-avatar.jpg',
      } as any)

      const result = await userService.updateAvatar(validObjectId, 'new-avatar.jpg')

      expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith(validObjectId, 'new-avatar.jpg')
      expect(result.avatar).toBe('new-avatar.jpg')
    })

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.updateAvatar.mockResolvedValue(null)

      await expect(userService.updateAvatar(validObjectId, 'avatar.jpg')).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(userService.updateAvatar('invalid-id', 'avatar.jpg')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any)

      const result = await userService.findByEmail('test@example.com')

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null when not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)

      const result = await userService.findByEmail('notfound@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findByEmailWithPassword', () => {
    it('should return user with password when found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)

      const result = await userService.findByEmailWithPassword('test@example.com')

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith('test@example.com')
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null when not found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null)

      const result = await userService.findByEmailWithPassword('notfound@example.com')

      expect(result).toBeNull()
    })
  })

  describe('searchUsers', () => {
    it('should return paginated search results', async () => {
      const paginatedResult = {
        data: [mockUser],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockUserRepository.search.mockResolvedValue(paginatedResult as any)

      const result = await userService.searchUsers('test', { page: 1, limit: 10 })

      expect(mockUserRepository.search).toHaveBeenCalled()
      expect(result.data.length).toBe(1)
    })
  })

  describe('updateProfile edge cases', () => {
    it('should throw ValidationError when missing new_password', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      ;(compareValue as jest.Mock).mockReturnValue(true)

      await expect(
        userService.updateProfile(validObjectId, { password: 'oldpassword' }),
      ).rejects.toThrow(ValidationError)
    })

    it('should update profile without password change', async () => {
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser, name: 'New Name' } as any)

      const result = await userService.updateProfile(validObjectId, { name: 'New Name' })

      expect(result.user.name).toBe('New Name')
      expect(hashValue).not.toHaveBeenCalled()
    })
  })

  // =================== Task 6.3: passwordChangedAt stamping + session revocation ===================

  describe('updateProfile — password change stamps passwordChangedAt and revokes sessions', () => {
    it('6.3 — stamps passwordChangedAt in updateById payload when password changes', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser } as any)
      ;(compareValue as jest.Mock).mockReturnValue(true)

      const before = Date.now()
      await userService.updateProfile(validObjectId, {
        password: 'oldpassword',
        new_password: 'newpassword',
      })
      const after = Date.now()

      const updateCall = mockUserRepository.updateById.mock.calls[0][1]
      expect(updateCall.passwordChangedAt).toBeInstanceOf(Date)
      expect(updateCall.passwordChangedAt.getTime()).toBeGreaterThanOrEqual(before)
      expect(updateCall.passwordChangedAt.getTime()).toBeLessThanOrEqual(after)
    })

    it('6.3 — calls revokeAllSessionsIncludingCurrent after password change when sessionService wired', async () => {
      const mockSessionService = {
        revokeAllSessions: jest.fn().mockResolvedValue(1),
      }
      userService.sessionService = mockSessionService as any

      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser } as any)
      ;(compareValue as jest.Mock).mockReturnValue(true)

      await userService.updateProfile(validObjectId, {
        password: 'oldpassword',
        new_password: 'newpassword',
      })

      expect(mockSessionService.revokeAllSessions).toHaveBeenCalledWith(validObjectId, undefined)
    })

    it('6.3 — does NOT call revokeAllSessionsIncludingCurrent when no password change', async () => {
      const mockSessionService = {
        revokeAllSessions: jest.fn().mockResolvedValue(0),
      }
      userService.sessionService = mockSessionService as any

      mockUserRepository.updateById.mockResolvedValue({ ...mockUser, name: 'Updated' } as any)

      await userService.updateProfile(validObjectId, { name: 'Updated' })

      expect(mockSessionService.revokeAllSessions).not.toHaveBeenCalled()
    })

    it('6.3 — does NOT stamp passwordChangedAt when no password change', async () => {
      mockUserRepository.updateById.mockResolvedValue({ ...mockUser, name: 'Updated' } as any)

      await userService.updateProfile(validObjectId, { name: 'Updated' })

      const updateCall = mockUserRepository.updateById.mock.calls[0][1]
      expect(updateCall.passwordChangedAt).toBeUndefined()
    })
  })

  describe('setPassword — stamps passwordChangedAt and revokes sessions', () => {
    it('6.3 — calls updatePassword (which stamps passwordChangedAt) and revokeAllSessionsIncludingCurrent', async () => {
      const mockSessionService = {
        revokeAllSessions: jest.fn().mockResolvedValue(1),
      }
      userService.sessionService = mockSessionService as any
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockUserRepository.updatePassword = jest.fn().mockResolvedValue(true)

      await userService.setPassword(validObjectId, 'newpassword123')

      expect(hashValue).toHaveBeenCalledWith('newpassword123')
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        validObjectId,
        'hashed_newpassword123',
        true,
      )
      expect(mockSessionService.revokeAllSessions).toHaveBeenCalledWith(validObjectId, undefined)
    })

    it('6.3 — throws NotFoundError when user not found during setPassword', async () => {
      mockUserRepository.updatePassword = jest.fn().mockResolvedValue(false)

      await expect(userService.setPassword(validObjectId, 'newpassword123')).rejects.toThrow('User')
    })

    it('6.3 — throws ValidationError for invalid ObjectId in setPassword', async () => {
      await expect(userService.setPassword('invalid-id', 'newpassword123')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('updateUser edge cases', () => {
    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(userService.updateUser('invalid-id', { name: 'Updated' })).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('deleteUser edge cases', () => {
    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(userService.deleteUser('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getProfile edge cases', () => {
    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(userService.getProfile('invalid-id')).rejects.toThrow(ValidationError)
    })
  })
})
