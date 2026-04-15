import { Types } from 'mongoose'
import {
  IVoucherRepository,
  ApplyVoucherInput,
  ApplyVoucherResult,
  VoucherStatusInfo,
  VoucherFilterOptions,
} from '@repositories/interfaces/voucher.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'
import { IVoucher } from '@database/models/voucher.model'
import { ISavedVoucher, VoucherStatus } from '@database/models/saved-voucher.model'

export class VoucherService extends BaseService {
  constructor(private readonly voucherRepository: IVoucherRepository) {
    super()
  }

  async getAvailableVouchers(
    pagination: PaginationOptions,
    userId?: string,
    filters?: VoucherFilterOptions,
  ): Promise<PaginatedResult<IVoucher & { is_collected?: boolean }>> {
    const result = await this.voucherRepository.findAvailable(
      this.normalizePagination(pagination),
      filters,
    )

    if (userId && this.isValidObjectId(userId)) {
      const collectedIds = await this.voucherRepository.getCollectedVoucherIds(userId)
      const dataWithCollected = result.data.map((v) => ({
        ...v,
        is_collected: collectedIds.includes(v._id.toString()),
      }))
      return { ...result, data: dataWithCollected }
    }

    return result
  }

  async getVoucherByCode(code: string): Promise<{ voucher: IVoucher; status: VoucherStatusInfo }> {
    if (!code) throw new ValidationError('Mã voucher là bắt buộc')

    const voucher = await this.voucherRepository.findByCode(code)
    if (!voucher || !voucher.is_active) throw new NotFoundError('Voucher', code)

    const now = new Date()
    const status: VoucherStatusInfo = {
      is_expired: voucher.end_date < now,
      is_not_started: voucher.start_date > now,
      is_used_up: voucher.used_count >= voucher.usage_limit,
      is_valid: false,
    }
    status.is_valid = !status.is_expired && !status.is_not_started && !status.is_used_up

    return { voucher, status }
  }

  async applyVoucher(input: ApplyVoucherInput): Promise<ApplyVoucherResult> {
    const { code, order_value, product_ids = [], category_ids = [] } = input
    if (!code) throw new ValidationError('Mã voucher là bắt buộc')

    const voucher = await this.voucherRepository.findByCode(code)
    if (!voucher || !voucher.is_active) throw new NotFoundError('Voucher', code)

    const now = new Date()
    if (voucher.start_date > now) throw new BusinessError('Voucher chưa đến thời gian sử dụng')
    if (voucher.end_date < now) throw new BusinessError('Voucher đã hết hạn')
    if (voucher.used_count >= voucher.usage_limit)
      throw new BusinessError('Voucher đã hết lượt sử dụng')
    if (order_value < voucher.min_order_value) {
      throw new BusinessError(
        `Giá trị đơn hàng tối thiểu là ${voucher.min_order_value.toLocaleString('vi-VN')}đ`,
      )
    }

    if (voucher.applicable_products && voucher.applicable_products.length > 0) {
      const applicableIds = voucher.applicable_products.map((id) => id.toString())
      if (!product_ids.some((id) => applicableIds.includes(id))) {
        throw new BusinessError('Voucher không áp dụng cho sản phẩm trong đơn hàng')
      }
    }

    if (voucher.applicable_categories && voucher.applicable_categories.length > 0) {
      const applicableIds = voucher.applicable_categories.map((id) => id.toString())
      if (!category_ids.some((id) => applicableIds.includes(id))) {
        throw new BusinessError('Voucher không áp dụng cho danh mục sản phẩm trong đơn hàng')
      }
    }

    const discount_amount = this.calculateDiscount(voucher, order_value)

    return {
      voucher_id: voucher._id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      discount_amount,
      final_value: order_value - discount_amount,
    }
  }

  async collectVoucher(userId: string, voucherId: string): Promise<ISavedVoucher> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(voucherId)) throw new ValidationError('Invalid voucher ID format')

    const voucher = await this.voucherRepository.findById(voucherId)
    if (!voucher) throw new NotFoundError('Voucher', voucherId)
    if (!voucher.is_active) throw new BusinessError('Voucher không còn hoạt động')

    const now = new Date()
    if (voucher.end_date < now) throw new BusinessError('Voucher đã hết hạn')
    if (voucher.used_count >= voucher.usage_limit)
      throw new BusinessError('Voucher đã hết lượt sử dụng')

    const existing = await this.voucherRepository.findSavedVoucher(userId, voucherId)
    if (existing) throw new BusinessError('Bạn đã thu thập voucher này rồi')

    return this.voucherRepository.saveVoucher(userId, voucherId)
  }

  async getSavedVouchers(
    userId: string,
    pagination: PaginationOptions,
    status?: VoucherStatus,
  ): Promise<PaginatedResult<ISavedVoucher & { computed_status?: string }>> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')

    const result = await this.voucherRepository.findSavedByUser(
      userId,
      this.normalizePagination(pagination),
      status,
    )
    const now = new Date()

    const dataWithStatus = result.data.map((item) => {
      const voucher = item.voucher as unknown as IVoucher
      if (!voucher) return { ...item, computed_status: 'expired' }

      let computedStatus = item.status
      if (item.status === 'available' && (voucher.end_date < now || !voucher.is_active)) {
        computedStatus = 'expired'
      }
      return { ...item, computed_status: computedStatus }
    })

    return { ...result, data: dataWithStatus }
  }

  async validateVoucher(
    userId: string,
    code: string,
    orderTotal: number,
  ): Promise<{ is_valid: boolean } & Partial<ApplyVoucherResult>> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!code) throw new ValidationError('Mã voucher là bắt buộc')

    const voucher = await this.voucherRepository.findByCode(code)
    if (!voucher || !voucher.is_active) throw new NotFoundError('Voucher', code)

    const userVoucher = await this.voucherRepository.findSavedVoucher(
      userId,
      voucher._id.toString(),
    )
    if (!userVoucher || userVoucher.status !== 'available') {
      throw new BusinessError('Bạn chưa thu thập voucher này hoặc đã sử dụng')
    }

    const now = new Date()
    if (voucher.start_date > now) throw new BusinessError('Voucher chưa đến thời gian sử dụng')
    if (voucher.end_date < now) throw new BusinessError('Voucher đã hết hạn')
    if (orderTotal < voucher.min_order_value) {
      throw new BusinessError(
        `Giá trị đơn hàng tối thiểu là ${voucher.min_order_value.toLocaleString('vi-VN')}đ`,
      )
    }

    const discount_amount = this.calculateDiscount(voucher, orderTotal)

    return {
      is_valid: true,
      voucher_id: voucher._id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      discount_amount,
      final_value: orderTotal - discount_amount,
    }
  }

  async useVoucher(userId: string, voucherId: string, orderId?: string): Promise<void> {
    await this.voucherRepository.markVoucherUsed(userId, voucherId, orderId)
    await this.voucherRepository.incrementUsedCount(voucherId)
  }

  private calculateDiscount(voucher: IVoucher, orderValue: number): number {
    let discount = 0
    if (voucher.discount_type === 'percentage') {
      discount = (orderValue * voucher.discount_value) / 100
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount
      }
    } else {
      discount = voucher.discount_value
    }
    return Math.min(discount, orderValue)
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async adminGetVouchers(
    filters: { is_active?: string; discount_type?: string; status?: string; search?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ) {
    return (this.voucherRepository as any).findAllWithFilters(filters, pagination)
  }

  async adminGetById(id: string): Promise<IVoucher> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid voucher ID')
    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundError('Voucher', id)
    return voucher
  }

  async adminCreate(data: any): Promise<IVoucher> {
    const existing = await this.voucherRepository.findByCode(data.code)
    if (existing) throw new BusinessError('Mã voucher đã tồn tại')
    return (this.voucherRepository as any).create(data)
  }

  async adminUpdate(id: string, data: any): Promise<IVoucher> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid voucher ID')
    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundError('Voucher', id)
    return (this.voucherRepository as any).updateById(id, data)
  }

  async adminDelete(id: string): Promise<void> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid voucher ID')
    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundError('Voucher', id)
    await (this.voucherRepository as any).deleteById(id)
  }

  async adminToggle(id: string): Promise<IVoucher> {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid voucher ID')
    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundError('Voucher', id)
    return (this.voucherRepository as any).updateById(id, { is_active: !voucher.is_active })
  }

  async adminGetUsage(id: string, pagination: { page: number; limit: number }) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid voucher ID')
    const voucher = await this.voucherRepository.findById(id)
    if (!voucher) throw new NotFoundError('Voucher', id)
    return (this.voucherRepository as any).getUsageStats(id, pagination)
  }

  async adminGetStats() {
    return (this.voucherRepository as any).getOverviewStats()
  }
}
