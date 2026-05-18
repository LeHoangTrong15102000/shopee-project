import { Types } from 'mongoose'
import { ISession } from '@database/models/session.model'

export interface ISessionRepository {
  create(data: {
    user_id: Types.ObjectId
    refreshTokenHash: string
    accessJti: string
    refreshJti: string
    device: string
    ip: string
    location: string
    lastActive: Date
    expiresAt: Date
    isRevoked: boolean
  }): Promise<ISession>

  findByRefreshTokenHash(hash: string, isRevoked?: boolean): Promise<ISession | null>

  findByUserId(userId: Types.ObjectId, isRevoked?: boolean): Promise<ISession[]>

  findActiveByUserId(userId: Types.ObjectId): Promise<ISession[]>

  countActiveByUserId(userId: Types.ObjectId): Promise<number>

  findActiveByUserIdPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ sessions: ISession[]; total: number }>

  updateByRefreshTokenHash(
    hash: string,
    update: Partial<{
      refreshTokenHash: string
      accessJti: string
      refreshJti: string
      lastActive: Date
      expiresAt: Date
      isRevoked: boolean
    }>,
  ): Promise<ISession | null>

  findById(id: Types.ObjectId | string): Promise<ISession | null>

  findByIdAndUserId(id: Types.ObjectId | string, userId: Types.ObjectId): Promise<ISession | null>

  revokeById(id: Types.ObjectId | string): Promise<void>

  revokeManyByIds(ids: (Types.ObjectId | string)[]): Promise<number>
}
