import { Types } from 'mongoose'
import { CheckInModel, ICheckIn } from '@database/models/checkin.model'
import { BaseService, BusinessError } from './base.service'

// Reward tiers based on streak day
const REWARD_TIERS = [
  { minDay: 1, maxDay: 2, coins: 5 },
  { minDay: 3, maxDay: 4, coins: 10 },
  { minDay: 5, maxDay: 6, coins: 15 },
  { minDay: 7, maxDay: Infinity, coins: 20 },
]

// Bonus milestones
const STREAK_BONUSES: Record<number, number> = {
  7: 50,
  14: 100,
  30: 200,
}

function getRewardForDay(streakDay: number): number {
  const tier = REWARD_TIERS.find((t) => streakDay >= t.minDay && streakDay <= t.maxDay)
  const base = tier?.coins ?? 5
  const bonus = STREAK_BONUSES[streakDay] ?? 0
  return base + bonus
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function getYesterdayUTC(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export class CheckInService extends BaseService {
  async checkIn(userId: string) {
    const today = getTodayUTC()
    const uid = new Types.ObjectId(userId)

    // Check duplicate
    const existing = await CheckInModel.findOne({ user_id: uid, date: today }).lean()
    if (existing) {
      throw new BusinessError('Bạn đã điểm danh hôm nay rồi')
    }

    // Calculate streak
    const yesterday = getYesterdayUTC()
    const lastCheckIn = await CheckInModel.findOne({ user_id: uid, date: yesterday }).lean()
    const streakDay = lastCheckIn ? lastCheckIn.streak_day + 1 : 1

    const rewardValue = getRewardForDay(streakDay)

    const record = await CheckInModel.create({
      user_id: uid,
      date: today,
      streak_day: streakDay,
      reward_type: 'coins',
      reward_value: rewardValue,
    })

    // Calculate total coins earned
    const totalCoinsResult = await CheckInModel.aggregate([
      { $match: { user_id: uid } },
      { $group: { _id: null, total: { $sum: '$reward_value' } } },
    ])
    const totalCoins = totalCoinsResult[0]?.total ?? 0

    return {
      date: record.date,
      streak: streakDay,
      reward: { type: 'coins', value: rewardValue },
      total_coins: totalCoins,
    }
  }

  async getStreak(userId: string) {
    const uid = new Types.ObjectId(userId)
    const today = getTodayUTC()

    // Get last check-in
    const lastCheckIn = await CheckInModel.findOne({ user_id: uid })
      .sort({ date: -1 })
      .lean<ICheckIn | null>()

    const canCheckinToday = !lastCheckIn || lastCheckIn.date !== today

    // Current streak: if last check-in was today or yesterday, use its streak_day
    let currentStreak = 0
    if (lastCheckIn) {
      const yesterday = getYesterdayUTC()
      if (lastCheckIn.date === today || lastCheckIn.date === yesterday) {
        currentStreak = lastCheckIn.streak_day
      }
    }

    // Longest streak
    const longestResult = await CheckInModel.aggregate([
      { $match: { user_id: uid } },
      { $group: { _id: null, longest: { $max: '$streak_day' } } },
    ])
    const longestStreak = longestResult[0]?.longest ?? 0

    // Total coins
    const totalCoinsResult = await CheckInModel.aggregate([
      { $match: { user_id: uid } },
      { $group: { _id: null, total: { $sum: '$reward_value' } } },
    ])
    const totalCoins = totalCoinsResult[0]?.total ?? 0

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_checkin_date: lastCheckIn?.date ?? null,
      can_checkin_today: canCheckinToday,
      total_coins: totalCoins,
    }
  }

  async getHistory(userId: string, pagination: { page: number; limit: number }) {
    const uid = new Types.ObjectId(userId)
    const { page, limit } = this.normalizePagination(pagination)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      CheckInModel.find({ user_id: uid })
        .select({ __v: 0 })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CheckInModel.countDocuments({ user_id: uid }),
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
}
