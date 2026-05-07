import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { container } from '../container'

const checkinService = container.services.checkin

export const adminGetCheckinUsers = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as any

  const result = await checkinService.adminGetUsers({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
  })

  return responseSuccess(res, {
    message: 'Lấy danh sách người dùng check-in thành công',
    data: result,
  })
}

export const adminGetCheckinLeaderboard = async (_req: Request, res: Response) => {
  const data = await checkinService.adminGetLeaderboard()
  return responseSuccess(res, { message: 'Lấy bảng xếp hạng check-in thành công', data })
}

export const adminGetCheckinDailyStats = async (_req: Request, res: Response) => {
  const data = await checkinService.adminGetDailyStats()
  return responseSuccess(res, { message: 'Lấy thống kê check-in theo ngày thành công', data })
}

// Existing admin stats endpoint (kept for backward compatibility)
export const adminGetCheckinStats = async (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const { CheckInModel } = await import('@database/models/checkin.model')

  const [total_today, recentActivity] = await Promise.all([
    CheckInModel.countDocuments({ date: today }),
    CheckInModel.find()
      .sort({ created_at: -1 })
      .limit(10)
      .populate('user_id', 'name email')
      .lean(),
  ])

  // Active streaks = users who checked in today or yesterday
  const activeStreakCount = await CheckInModel.aggregate([
    { $match: { date: { $in: [today, yesterdayStr] } } },
    { $group: { _id: '$user_id' } },
    { $count: 'count' },
  ])

  const active_streaks = activeStreakCount[0]?.count ?? 0

  const recent_activity = recentActivity.map((r: any) => ({
    _id: r._id,
    user: r.user_id,
    streak: r.streak_day,
    points_earned: r.reward_value,
    createdAt: r.created_at,
  }))

  return responseSuccess(res, {
    message: 'Lấy thống kê check-in thành công',
    data: { total_today, active_streaks, recent_activity },
  })
}
