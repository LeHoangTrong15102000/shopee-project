import { Types } from 'mongoose'
import { VoucherModel, IVoucher } from '@database/models/voucher.model'
import { SavedVoucherModel, ISavedVoucher, VoucherStatus } from '@database/models/saved-voucher.model'
import { IVoucherRepository, VoucherFilterOptions } from './interfaces/voucher.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class VoucherRepository implements IVoucherRepository {
  async findAvailable(
    pagination: PaginationOptions,
    filters?: VoucherFilterOptions
  ): Promise<PaginatedResult<IVoucher>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const now = new Date()

    const query: Record<string, unknown> = {
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
      $expr: { $lt: ['$used_count', '$usage_limit'] },
    }

    if (filters?.discount_type) {
      query.discount_type = filters.discount_type
    }

    const [data, total] = await Promise.all([
      VoucherModel.find(query).select({ __v: 0 }).sort({ created_at: -1 }).skip(skip).limit(limit).lean<IVoucher[]>(),
      VoucherModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findByCode(code: string): Promise<IVoucher | null> {
    return VoucherModel.findOne({ code: code.toUpperCase() }).select({ __v: 0 }).lean<IVoucher | null>()
  }

  async findById(id: string | Types.ObjectId): Promise<IVoucher | null> {
    return VoucherModel.findById(id).select({ __v: 0 }).lean<IVoucher | null>()
  }

  async incrementUsedCount(id: string | Types.ObjectId): Promise<IVoucher | null> {
    return VoucherModel.findByIdAndUpdate(id, { $inc: { used_count: 1 } }, { new: true }).lean<IVoucher | null>()
  }

  async findSavedByUser(
    userId: string | Types.ObjectId,
    pagination: PaginationOptions,
    status?: VoucherStatus
  ): Promise<PaginatedResult<ISavedVoucher>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = { user: new Types.ObjectId(userId.toString()) }
    if (status && status !== 'available') {
      query.status = status
    }

    const [data, total] = await Promise.all([
      SavedVoucherModel.find(query)
        .populate({ path: 'voucher', select: { __v: 0 } })
        .sort({ saved_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ISavedVoucher[]>(),
      SavedVoucherModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findSavedVoucher(
    userId: string | Types.ObjectId,
    voucherId: string | Types.ObjectId
  ): Promise<ISavedVoucher | null> {
    return SavedVoucherModel.findOne({
      user: new Types.ObjectId(userId.toString()),
      voucher: new Types.ObjectId(voucherId.toString()),
    })
      .populate({ path: 'voucher', select: { __v: 0 } })
      .lean<ISavedVoucher | null>()
  }

  async saveVoucher(userId: string | Types.ObjectId, voucherId: string | Types.ObjectId): Promise<ISavedVoucher> {
    const saved = await SavedVoucherModel.create({
      user: new Types.ObjectId(userId.toString()),
      voucher: new Types.ObjectId(voucherId.toString()),
      status: 'available',
    })
    return SavedVoucherModel.findById(saved._id)
      .populate({ path: 'voucher', select: { __v: 0 } })
      .lean<ISavedVoucher>() as Promise<ISavedVoucher>
  }

  async markVoucherUsed(
    userId: string | Types.ObjectId,
    voucherId: string | Types.ObjectId,
    orderId?: string | Types.ObjectId
  ): Promise<ISavedVoucher | null> {
    const update: Record<string, unknown> = { status: 'used', used_at: new Date() }
    if (orderId) {
      update.order_id = new Types.ObjectId(orderId.toString())
    }
    return SavedVoucherModel.findOneAndUpdate(
      {
        user: new Types.ObjectId(userId.toString()),
        voucher: new Types.ObjectId(voucherId.toString()),
        status: 'available',
      },
      update,
      { new: true }
    ).lean<ISavedVoucher | null>()
  }

  async getCollectedVoucherIds(userId: string | Types.ObjectId): Promise<string[]> {
    const collected = await SavedVoucherModel.find({ user: new Types.ObjectId(userId.toString()) })
      .select('voucher')
      .lean()
    return collected.map((c) => c.voucher.toString())
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async findAllWithFilters(
    filters: { is_active?: string; discount_type?: string; status?: string; search?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' }
  ): Promise<PaginatedResult<IVoucher>> {
    const { page, limit, sort_by = 'createdAt', order = 'desc' } = pagination
    const skip = (page - 1) * limit
    const now = new Date()

    const query: Record<string, any> = {}

    if (filters.is_active !== undefined) query.is_active = filters.is_active === 'true'
    if (filters.discount_type) query.discount_type = filters.discount_type
    if (filters.search) query.code = new RegExp(filters.search, 'i')

    if (filters.status === 'active') {
      query.is_active = true
      query.start_date = { $lte: now }
      query.end_date = { $gte: now }
      query.$expr = { $lt: ['$used_count', '$usage_limit'] }
    } else if (filters.status === 'expired') {
      query.end_date = { $lt: now }
    } else if (filters.status === 'upcoming') {
      query.start_date = { $gt: now }
    } else if (filters.status === 'used_up') {
      query.$expr = { $gte: ['$used_count', '$usage_limit'] }
    }

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [data, total] = await Promise.all([
      VoucherModel.find(query).select({ __v: 0 }).sort(sortObj).skip(skip).limit(limit).lean<IVoucher[]>(),
      VoucherModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async create(data: any): Promise<IVoucher> {
    const voucher = await VoucherModel.create({
      ...data,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
    })
    return VoucherModel.findById(voucher._id).select({ __v: 0 }).lean<IVoucher>() as Promise<IVoucher>
  }

  async updateById(id: string, data: any): Promise<IVoucher> {
    const updateData = { ...data }
    if (data.start_date) updateData.start_date = new Date(data.start_date)
    if (data.end_date) updateData.end_date = new Date(data.end_date)
    return VoucherModel.findByIdAndUpdate(id, updateData, { new: true }).select({ __v: 0 }).lean<IVoucher>() as Promise<IVoucher>
  }

  async deleteById(id: string): Promise<void> {
    await VoucherModel.findByIdAndDelete(id)
  }

  async getUsageStats(id: string, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      SavedVoucherModel.find({ voucher: new Types.ObjectId(id) })
        .populate({ path: 'user', select: 'name email avatar' })
        .sort({ saved_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedVoucherModel.countDocuments({ voucher: new Types.ObjectId(id) }),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async getOverviewStats() {
    const now = new Date()
    const [total, active, expired, totalUsed] = await Promise.all([
      VoucherModel.countDocuments(),
      VoucherModel.countDocuments({ is_active: true, start_date: { $lte: now }, end_date: { $gte: now } }),
      VoucherModel.countDocuments({ end_date: { $lt: now } }),
      VoucherModel.aggregate([{ $group: { _id: null, total: { $sum: '$used_count' } } }]),
    ])

    return {
      total,
      active,
      expired,
      upcoming: await VoucherModel.countDocuments({ start_date: { $gt: now } }),
      total_used: totalUsed[0]?.total || 0,
    }
  }
}

