/// <reference types="jest" />
import { Types } from 'mongoose'
import { ReferralService } from '@services/referral.service'
import { ValidationError, BusinessError, ConflictError, NotFoundError } from '@services/base.service'

// Mock Mongoose models — use jest.fn() at top level so hoisting works
const mockCodeFindOne = jest.fn()
const mockCodeCreate = jest.fn()
const mockCodeUpdateOne = jest.fn()
const mockCodeCountDocuments = jest.fn()

const mockRewardFindOne = jest.fn()
const mockRewardCreate = jest.fn()
const mockRewardUpdateOne = jest.fn()
const mockRewardCountDocuments = jest.fn()
const mockRewardAggregate = jest.fn()

jest.mock('@database/models/referral-code.model', () => ({
  ReferralCodeModel: {
    findOne: (...args: unknown[]) => mockCodeFindOne(...args),
    create: (...args: unknown[]) => mockCodeCreate(...args),
    updateOne: (...args: unknown[]) => mockCodeUpdateOne(...args),
    countDocuments: (...args: unknown[]) => mockCodeCountDocuments(...args),
  },
}))

jest.mock('@database/models/referral-reward.model', () => ({
  ReferralRewardModel: {
    findOne: (...args: unknown[]) => mockRewardFindOne(...args),
    create: (...args: unknown[]) => mockRewardCreate(...args),
    updateOne: (...args: unknown[]) => mockRewardUpdateOne(...args),
    countDocuments: (...args: unknown[]) => mockRewardCountDocuments(...args),
    aggregate: (...args: unknown[]) => mockRewardAggregate(...args),
  },
}))

describe('ReferralService', () => {
  let service: ReferralService

  const userId = new Types.ObjectId().toString()
  const referrerId = new Types.ObjectId().toString()
  const refereeId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReferralService()
  })

  describe('generateCode', () => {
    it('throws ValidationError for invalid userId', async () => {
      await expect(service.generateCode('not-an-id')).rejects.toThrow(ValidationError)
    })

    it('returns existing code if one exists', async () => {
      const existingCode = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        code: 'EXISTING1',
        usageCount: 3,
        maxUsages: 50,
        isActive: true,
      }
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(existingCode),
      })

      const result = await service.generateCode(userId)
      expect(result.code).toBe('EXISTING1')
      expect(mockCodeCreate).not.toHaveBeenCalled()
    })

    it('creates a new code when none exists', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(null),
      })
      const newCode = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        code: 'NEWCODE1',
        usageCount: 0,
        maxUsages: 50,
        isActive: true,
        toObject: () => ({ code: 'NEWCODE1', usageCount: 0, maxUsages: 50, isActive: true }),
      }
      mockCodeCreate.mockResolvedValue(newCode)

      const result = await service.generateCode(userId)
      expect(result.code).toBe('NEWCODE1')
      expect(mockCodeCreate).toHaveBeenCalledTimes(1)
    })

    it('retries on duplicate key error and throws BusinessError after 5 attempts', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(null),
      })
      const dupError = Object.assign(new Error('dup'), { code: 11000 })
      mockCodeCreate.mockRejectedValue(dupError)

      await expect(service.generateCode(userId)).rejects.toThrow(BusinessError)
      expect(mockCodeCreate).toHaveBeenCalledTimes(5)
    })
  })

  describe('applyCode', () => {
    const validCode = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(referrerId),
      code: 'VALIDCODE',
      usageCount: 0,
      maxUsages: 50,
      rewardPerReferral: 50000,
      isActive: true,
      expiresAt: null,
    }

    it('throws ValidationError for invalid refereeId', async () => {
      await expect(service.applyCode('bad-id', 'VALIDCODE')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for empty code', async () => {
      await expect(service.applyCode(refereeId, '')).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when code does not exist', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(null),
      })
      await expect(service.applyCode(refereeId, 'BADCODE')).rejects.toThrow(NotFoundError)
    })

    it('throws BusinessError when code is inactive', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve({ ...validCode, isActive: false }),
      })
      await expect(service.applyCode(refereeId, 'VALIDCODE')).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when code is expired', async () => {
      const pastDate = new Date(Date.now() - 1000)
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve({ ...validCode, expiresAt: pastDate }),
      })
      await expect(service.applyCode(refereeId, 'VALIDCODE')).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError when usage limit is reached', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve({ ...validCode, usageCount: 50, maxUsages: 50 }),
      })
      await expect(service.applyCode(refereeId, 'VALIDCODE')).rejects.toThrow(BusinessError)
    })

    it('throws BusinessError on self-referral', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve({ ...validCode, userId: new Types.ObjectId(refereeId) }),
      })
      await expect(service.applyCode(refereeId, 'VALIDCODE')).rejects.toThrow(BusinessError)
    })

    it('throws ConflictError when referee already applied a code', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(validCode),
      })
      mockRewardFindOne.mockReturnValue({
        lean: () => Promise.resolve({ _id: new Types.ObjectId() }),
      })
      await expect(service.applyCode(refereeId, 'VALIDCODE')).rejects.toThrow(ConflictError)
    })

    it('creates reward and increments usage count on valid apply', async () => {
      mockCodeFindOne.mockReturnValue({
        lean: () => Promise.resolve(validCode),
      })
      mockRewardFindOne.mockReturnValue({
        lean: () => Promise.resolve(null),
      })
      const createdReward = {
        _id: new Types.ObjectId(),
        referrerId: validCode.userId,
        refereeId: new Types.ObjectId(refereeId),
        rewardType: 'voucher',
        rewardValue: 50000,
        status: 'pending',
        toObject: () => ({
          rewardType: 'voucher',
          rewardValue: 50000,
          status: 'pending',
        }),
      }
      mockRewardCreate.mockResolvedValue(createdReward)
      mockCodeUpdateOne.mockResolvedValue({ modifiedCount: 1 })

      const result = await service.applyCode(refereeId, 'VALIDCODE')

      expect(result.status).toBe('pending')
      expect(result.rewardValue).toBe(50000)
      expect(mockCodeUpdateOne).toHaveBeenCalledWith(
        { _id: validCode._id },
        { $inc: { usageCount: 1 } },
      )
    })
  })

  describe('processReferralReward', () => {
    it('does nothing when refereeId is invalid', async () => {
      await service.processReferralReward('bad-id', new Types.ObjectId().toString())
      expect(mockRewardFindOne).not.toHaveBeenCalled()
    })

    it('does nothing when no pending reward exists', async () => {
      mockRewardFindOne.mockReturnValue({
        lean: () => Promise.resolve(null),
      })
      await service.processReferralReward(refereeId, new Types.ObjectId().toString())
      expect(mockRewardUpdateOne).not.toHaveBeenCalled()
    })

    it('marks reward as rewarded when pending reward exists', async () => {
      const orderId = new Types.ObjectId().toString()
      const pendingReward = {
        _id: new Types.ObjectId(),
        referrerId: new Types.ObjectId(referrerId),
        refereeId: new Types.ObjectId(refereeId),
        status: 'pending',
        rewardValue: 50000,
      }
      mockRewardFindOne.mockReturnValue({
        lean: () => Promise.resolve(pendingReward),
      })
      mockRewardUpdateOne.mockResolvedValue({ modifiedCount: 1 })

      await service.processReferralReward(refereeId, orderId)

      expect(mockRewardUpdateOne).toHaveBeenCalledWith(
        { _id: pendingReward._id },
        expect.objectContaining({
          $set: expect.objectContaining({ status: 'rewarded' }),
        }),
      )
    })
  })
})
