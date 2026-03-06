/// <reference types="jest" />

const mockUserData = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'avatar.jpg',
  roles: ['User'],
  toObject: () => mockUserData,
}

jest.mock('@database/models/user.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.updateOne = jest.fn()
  mockModel.exists = jest.fn()
  return { UserModel: mockModel }
})

import { UserModel } from '@database/models/user.model'
import { UserRepository } from '../../repositories/user.repository'

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup constructor mock for create operations
    ;(UserModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockUserData }),
    }))
    repository = new UserRepository()
  })

  describe('findById', () => {
    it('should find user by id without password', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(UserModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(mockSelect).toHaveBeenCalledWith({ password: 0 })
      expect(result).toEqual(mockUserData)
    })
  })

  describe('findOne', () => {
    it('should find one user with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findOne as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findOne({ email: 'test@example.com' })

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(result).toEqual(mockUserData)
    })
  })

  describe('find', () => {
    it('should find users with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockUserData])
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.find({ roles: 'User' })

      expect(UserModel.find).toHaveBeenCalledWith({ roles: 'User' }, null, undefined)
      expect(result).toEqual([mockUserData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockUserData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
      ;(UserModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockUserData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const result = await repository.create({ email: 'new@example.com', password: 'hash' } as any)
      expect(result).toBeDefined()
    })
  })

  describe('updateById', () => {
    it('should update user by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { name: 'Updated' })

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { name: 'Updated' }, { new: true })
      expect(result).toEqual(mockUserData)
    })
  })

  describe('deleteById', () => {
    it('should delete user by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findByIdAndDelete as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockUserData)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(UserModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ roles: 'User' })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.exists({ email: 'test@example.com' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ email: 'nonexistent@example.com' })
      expect(result).toBe(false)
    })
  })

  describe('findByEmail', () => {
    it('should find user by email without password', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findOne as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.findByEmail('test@example.com')

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(mockSelect).toHaveBeenCalledWith({ password: 0 })
      expect(result).toEqual(mockUserData)
    })
  })

  describe('findByEmailWithPassword', () => {
    it('should find user by email with password', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockUserData, password: 'hashedPassword' })
      ;(UserModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findByEmailWithPassword('test@example.com')

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(result).toHaveProperty('password')
    })
  })

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.emailExists('test@example.com')
      expect(UserModel.exists).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(result).toBe(true)
    })

    it('should return false if email does not exist', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.emailExists('nonexistent@example.com')
      expect(result).toBe(false)
    })
  })

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockUserData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
      ;(UserModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByRole('Admin', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockUserData])
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      ;(UserModel.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 })

      const result = await repository.updatePassword('507f1f77bcf86cd799439011', 'newHashedPassword')

      expect(UserModel.updateOne).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if password not updated', async () => {
      ;(UserModel.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 0 })

      const result = await repository.updatePassword('507f1f77bcf86cd799439011', 'newHashedPassword')

      expect(result).toBe(false)
    })
  })

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockUserData, avatar: 'new-avatar.jpg' })
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.updateAvatar('507f1f77bcf86cd799439011', 'new-avatar.jpg')

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { avatar: 'new-avatar.jpg' }, { new: true })
      expect(result?.avatar).toBe('new-avatar.jpg')
    })
  })

  describe('getProfile', () => {
    it('should get user profile without password', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockUserData)
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      ;(UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await repository.getProfile('507f1f77bcf86cd799439011')

      expect(UserModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(mockSelect).toHaveBeenCalledWith({ password: 0, __v: 0 })
      expect(result).toEqual(mockUserData)
    })
  })

  describe('search', () => {
    it('should search users by name or email', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockUserData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort })
      ;(UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect })
      ;(UserModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.search('test', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockUserData])
    })
  })
})

