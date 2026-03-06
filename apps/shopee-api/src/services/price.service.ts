import { Types } from 'mongoose'
import {
  IPriceRepository,
  IPriceHistoryItem,
  IPriceAlertItem,
  PriceAlertFilterOptions,
} from '@repositories/interfaces/price.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'

export class PriceService extends BaseService {
  constructor(
    private readonly priceRepository: IPriceRepository,
    private readonly productRepository: IProductRepository
  ) {
    super()
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<{ price_history: IPriceHistoryItem[]; days: number }> {
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }

    const normalizedDays = Math.min(Math.max(days, 1), 365)
    const priceHistory = await this.priceRepository.findPriceHistory(productId, normalizedDays)

    return {
      price_history: priceHistory,
      days: normalizedDays,
    }
  }

  async createPriceAlert(userId: string, productId: string, targetPrice: number): Promise<IPriceAlertItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(productId)) {
      throw new ValidationError('Invalid product ID format')
    }
    if (targetPrice === undefined || targetPrice < 0) {
      throw new ValidationError('Invalid target price')
    }

    // Check product exists
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    // Check for existing alert
    const existingAlert = await this.priceRepository.findActiveAlertByUserAndProduct(userId, productId)
    if (existingAlert) {
      throw new BusinessError('Bạn đã có cảnh báo giá cho sản phẩm này')
    }

    return this.priceRepository.createAlert({
      user_id: new Types.ObjectId(userId),
      product_id: new Types.ObjectId(productId),
      target_price: targetPrice,
      current_price: product.price,
    })
  }

  async getPriceAlerts(
    userId: string,
    filters: PriceAlertFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IPriceAlertItem>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.priceRepository.findAlertsByUser(userId, filters, this.normalizePagination(pagination))
  }

  async deletePriceAlert(userId: string, alertId: string): Promise<IPriceAlertItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(alertId)) {
      throw new ValidationError('Invalid alert ID format')
    }

    const deleted = await this.priceRepository.deleteAlertByIdAndUser(alertId, userId)
    if (!deleted) {
      throw new NotFoundError('Price alert', alertId)
    }
    return deleted
  }
}

