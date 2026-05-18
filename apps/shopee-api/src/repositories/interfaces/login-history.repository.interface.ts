import { Types } from 'mongoose'
import { ILoginHistory, LoginStatus, LoginMethod } from '@database/models/login-history.model'

export interface ILoginHistoryRepository {
  create(data: {
    user_id: Types.ObjectId | null
    ip: string
    userAgent: string
    device: string
    location: string
    status: LoginStatus
    method: LoginMethod
    timestamp: Date
  }): Promise<ILoginHistory>

  findByUserId(
    userId: Types.ObjectId,
    options: {
      page: number
      limit: number
      status?: LoginStatus
    },
  ): Promise<{ entries: ILoginHistory[]; total: number }>
}
