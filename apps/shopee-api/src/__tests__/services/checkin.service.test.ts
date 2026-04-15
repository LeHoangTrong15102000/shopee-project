/// <reference types="jest" />
jest.mock('@database/models/checkin.model', () => ({
  CheckInModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  ICheckIn: {},
}))

import { CheckInService } from '@services/checkin.service'
import { CheckInModel } from '@database/models/checkin.model'
import { BusinessError } from '@services/base.service'

describe('CheckInService', () => {
  let service: CheckInService

  beforeEach(() => {
    service = new CheckInService()
    jest.clearAllMocks()
  })

  describe('checkIn', () => {
    it('should create first check-in with streak_day=1 and reward 5 coins', async () => {
      ;(CheckInModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      ;(CheckInModel.create as jest.Mock).mockResolvedValue({
        date: '2026-03-16',
        streak_day: 1,
        reward_value: 5,
      })
      ;(CheckInModel.aggregate as jest.Mock).mockResolvedValue([{ total: 5 }])

      const result = await service.checkIn('507f1f77bcf86cd799439011')

      expect(result).toEqual({
        date: '2026-03-16',
        streak: 1,
        reward: { type: 'coins', value: 5 },
        total_coins: 5,
      })
      expect(CheckInModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          streak_day: 1,
          reward_value: 5,
        }),
      )
    })

    it('should throw BusinessError on duplicate check-in', async () => {
      ;(CheckInModel.findOne as jest.Mock).mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ date: '2026-03-16' }),
      })

      await expect(service.checkIn('507f1f77bcf86cd799439011')).rejects.toThrow(BusinessError)
    })

    it('should continue streak when yesterday exists with streak_day=3', async () => {
      ;(CheckInModel.findOne as jest.Mock)
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue({ streak_day: 3 }),
        })
      ;(CheckInModel.create as jest.Mock).mockResolvedValue({
        date: '2026-03-16',
        streak_day: 4,
        reward_value: 10,
      })
      ;(CheckInModel.aggregate as jest.Mock).mockResolvedValue([{ total: 35 }])

      const result = await service.checkIn('507f1f77bcf86cd799439011')

      expect(result.streak).toBe(4)
      expect(CheckInModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          streak_day: 4,
          reward_value: 10,
        }),
      )
    })
  })

  describe('getStreak', () => {
    it('should return zeros when no check-ins exist', async () => {
      ;(CheckInModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      })
      ;(CheckInModel.aggregate as jest.Mock).mockResolvedValue([])

      const result = await service.getStreak('507f1f77bcf86cd799439011')

      expect(result).toEqual({
        current_streak: 0,
        longest_streak: 0,
        last_checkin_date: null,
        can_checkin_today: true,
        total_coins: 0,
      })
    })

    it('should return streak data when check-ins exist', async () => {
      // Fix date so '2026-03-15' is yesterday
      jest.useFakeTimers({ now: new Date('2026-03-16T12:00:00Z') })
      ;(CheckInModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ date: '2026-03-15', streak_day: 5 }),
        }),
      })
      ;(CheckInModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ longest: 7 }])
        .mockResolvedValueOnce([{ total: 100 }])

      const result = await service.getStreak('507f1f77bcf86cd799439011')

      expect(result.current_streak).toBe(5)
      expect(result.longest_streak).toBe(7)
      expect(result.last_checkin_date).toBe('2026-03-15')
      expect(result.can_checkin_today).toBe(true)
      expect(result.total_coins).toBe(100)

      jest.useRealTimers()
    })
  })

  describe('getHistory', () => {
    it('should return paginated check-in history', async () => {
      const mockData = [
        { date: '2026-03-16', streak_day: 1, reward_value: 5 },
        { date: '2026-03-15', streak_day: 1, reward_value: 5 },
      ]
      ;(CheckInModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      })
      ;(CheckInModel.countDocuments as jest.Mock).mockResolvedValue(2)

      const result = await service.getHistory('507f1f77bcf86cd799439011', { page: 1, limit: 10 })

      expect(result.data).toEqual(mockData)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        page_size: 1,
        total: 2,
      })
    })
  })
})
