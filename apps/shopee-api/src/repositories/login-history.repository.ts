import { Types } from 'mongoose'
import { LoginHistoryModel, ILoginHistory, LoginStatus, LoginMethod } from '@database/models/login-history.model'
import { ILoginHistoryRepository } from './interfaces/login-history.repository.interface'

export class LoginHistoryRepository implements ILoginHistoryRepository {
  async create(data: {
    user_id: Types.ObjectId | null
    ip: string
    userAgent: string
    device: string
    location: string
    status: LoginStatus
    method: LoginMethod
    timestamp: Date
  }): Promise<ILoginHistory> {
    return LoginHistoryModel.create(data)
  }

  async findByUserId(
    userId: Types.ObjectId,
    options: { page: number; limit: number; status?: LoginStatus },
  ): Promise<{ entries: ILoginHistory[]; total: number }> {
    const query: Record<string, unknown> = { user_id: userId }
    if (options.status) query.status = options.status

    const [entries, total] = await Promise.all([
      LoginHistoryModel.find(query)
        .sort({ timestamp: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean(),
      LoginHistoryModel.countDocuments(query),
    ])

    return { entries, total }
  }
}
