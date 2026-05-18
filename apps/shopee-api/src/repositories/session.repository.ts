import { Types } from 'mongoose'
import { SessionModel, ISession } from '@database/models/session.model'
import { ISessionRepository } from './interfaces/session.repository.interface'

export class SessionRepository implements ISessionRepository {
  async create(data: {
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
  }): Promise<ISession> {
    return SessionModel.create(data)
  }

  async findByRefreshTokenHash(hash: string, isRevoked = false): Promise<ISession | null> {
    return SessionModel.findOne({ refreshTokenHash: hash, isRevoked }).lean()
  }

  async findByUserId(userId: Types.ObjectId, isRevoked?: boolean): Promise<ISession[]> {
    const query: Record<string, unknown> = { user_id: userId }
    if (isRevoked !== undefined) query.isRevoked = isRevoked
    return SessionModel.find(query).lean()
  }

  async findActiveByUserId(userId: Types.ObjectId): Promise<ISession[]> {
    return SessionModel.find({
      user_id: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).lean()
  }

  async countActiveByUserId(userId: Types.ObjectId): Promise<number> {
    return SessionModel.countDocuments({
      user_id: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
  }

  async findActiveByUserIdPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ sessions: ISession[]; total: number }> {
    const query = {
      user_id: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }
    const [sessions, total] = await Promise.all([
      SessionModel.find(query)
        .sort({ lastActive: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SessionModel.countDocuments(query),
    ])
    return { sessions, total }
  }

  async updateByRefreshTokenHash(
    hash: string,
    update: Partial<{
      refreshTokenHash: string
      accessJti: string
      refreshJti: string
      lastActive: Date
      expiresAt: Date
      isRevoked: boolean
    }>,
  ): Promise<ISession | null> {
    return SessionModel.findOneAndUpdate(
      { refreshTokenHash: hash, isRevoked: false },
      { $set: update },
      { new: true },
    ).lean()
  }

  async findById(id: Types.ObjectId | string): Promise<ISession | null> {
    return SessionModel.findById(id).lean()
  }

  async findByIdAndUserId(
    id: Types.ObjectId | string,
    userId: Types.ObjectId,
  ): Promise<ISession | null> {
    return SessionModel.findOne({
      _id: new Types.ObjectId(id.toString()),
      user_id: userId,
      isRevoked: false,
    }).lean()
  }

  async revokeById(id: Types.ObjectId | string): Promise<void> {
    await SessionModel.findByIdAndUpdate(id, { $set: { isRevoked: true } })
  }

  async revokeManyByIds(ids: (Types.ObjectId | string)[]): Promise<number> {
    const result = await SessionModel.updateMany(
      { _id: { $in: ids } },
      { $set: { isRevoked: true } },
    )
    return result.modifiedCount
  }
}
