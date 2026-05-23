/**
 * Unit tests for DeviceTokenService.
 */

/// <reference types="jest" />
import { Types } from 'mongoose'
import { DeviceTokenService } from '@services/device-token.service'
import { ForbiddenError, ValidationError } from '@services/base.service'
import { IDeviceToken, DEVICE_PLATFORM } from '@database/models/device-token.model'

const validUserId = new Types.ObjectId().toString()
const validTokenId = new Types.ObjectId().toString()

const mockToken: IDeviceToken = {
  _id: new Types.ObjectId(validTokenId),
  userId: new Types.ObjectId(validUserId),
  token: 'fcm-token-abc123',
  platform: DEVICE_PLATFORM.ANDROID,
  deviceName: 'Pixel 7',
  createdAt: new Date(),
  lastUsed: new Date(),
}

const makeRepoMock = () => ({
  upsertToken: jest.fn(),
  findByUserId: jest.fn(),
  deleteById: jest.fn(),
  deleteByToken: jest.fn(),
})

describe('DeviceTokenService', () => {
  let repo: ReturnType<typeof makeRepoMock>
  let service: DeviceTokenService

  beforeEach(() => {
    repo = makeRepoMock()
    service = new DeviceTokenService(repo as any)
    jest.clearAllMocks()
  })

  describe('registerToken', () => {
    it('calls upsertToken with the correct arguments and returns the result', async () => {
      repo.upsertToken.mockResolvedValue(mockToken)

      const result = await service.registerToken(validUserId, {
        token: 'fcm-token-abc123',
        platform: DEVICE_PLATFORM.ANDROID,
        deviceName: 'Pixel 7',
      })

      expect(repo.upsertToken).toHaveBeenCalledTimes(1)
      expect(repo.upsertToken).toHaveBeenCalledWith(
        validUserId,
        'fcm-token-abc123',
        DEVICE_PLATFORM.ANDROID,
        'Pixel 7',
      )
      expect(result).toBe(mockToken)
    })

    it('trims whitespace from the token before upserting', async () => {
      repo.upsertToken.mockResolvedValue(mockToken)

      await service.registerToken(validUserId, {
        token: '  fcm-token-abc123  ',
        platform: DEVICE_PLATFORM.IOS,
      })

      expect(repo.upsertToken).toHaveBeenCalledWith(
        validUserId,
        'fcm-token-abc123',
        DEVICE_PLATFORM.IOS,
        undefined,
      )
    })

    it('throws ValidationError for an invalid userId', async () => {
      await expect(
        service.registerToken('not-an-objectid', {
          token: 'fcm-token',
          platform: DEVICE_PLATFORM.WEB,
        }),
      ).rejects.toThrow(ValidationError)

      expect(repo.upsertToken).not.toHaveBeenCalled()
    })

    it('throws ValidationError when token is empty', async () => {
      await expect(
        service.registerToken(validUserId, {
          token: '   ',
          platform: DEVICE_PLATFORM.WEB,
        }),
      ).rejects.toThrow(ValidationError)

      expect(repo.upsertToken).not.toHaveBeenCalled()
    })
  })

  describe('unregisterToken', () => {
    it('calls deleteById with tokenId and userId and returns the deleted token', async () => {
      repo.deleteById.mockResolvedValue(mockToken)

      const result = await service.unregisterToken(validUserId, validTokenId)

      expect(repo.deleteById).toHaveBeenCalledTimes(1)
      expect(repo.deleteById).toHaveBeenCalledWith(validTokenId, validUserId)
      expect(result).toBe(mockToken)
    })

    it('throws ForbiddenError when the token does not belong to the user (deleteById returns null)', async () => {
      repo.deleteById.mockResolvedValue(null)

      await expect(service.unregisterToken(validUserId, validTokenId)).rejects.toThrow(
        ForbiddenError,
      )
    })

    it('throws ForbiddenError with status 403', async () => {
      repo.deleteById.mockResolvedValue(null)

      try {
        await service.unregisterToken(validUserId, validTokenId)
        fail('Expected ForbiddenError to be thrown')
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenError)
        expect(err.statusCode).toBe(403)
      }
    })

    it('throws ValidationError for an invalid userId', async () => {
      await expect(service.unregisterToken('bad-id', validTokenId)).rejects.toThrow(ValidationError)
      expect(repo.deleteById).not.toHaveBeenCalled()
    })

    it('throws ValidationError for an invalid tokenId', async () => {
      await expect(service.unregisterToken(validUserId, 'bad-id')).rejects.toThrow(ValidationError)
      expect(repo.deleteById).not.toHaveBeenCalled()
    })
  })
})
