import { Types } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'

/**
 * Price history interface
 */
export interface IPriceHistoryItem {
  _id?: Types.ObjectId
  product_id: Types.ObjectId
  price: number
  price_before_discount: number
  recorded_at: Date
}

/**
 * Price alert interface
 */
export interface IPriceAlertItem {
  _id?: Types.ObjectId
  user_id: Types.ObjectId
  product_id: Types.ObjectId | { name?: string; image?: string; price?: number; price_before_discount?: number }
  target_price: number
  current_price: number
  is_triggered: boolean
  is_active: boolean
  created_at: Date
  triggered_at?: Date
}

/**
 * Create price alert DTO
 */
export interface CreatePriceAlertDTO {
  user_id: Types.ObjectId | string
  product_id: Types.ObjectId | string
  target_price: number
  current_price: number
}

/**
 * Price alert filter options
 */
export interface PriceAlertFilterOptions {
  is_active?: boolean
  is_triggered?: boolean
}

/**
 * Price repository interface
 */
export interface IPriceRepository {
  // Price History
  findPriceHistory(productId: string | Types.ObjectId, days: number): Promise<IPriceHistoryItem[]>

  // Price Alerts
  findAlertsByUser(
    userId: string | Types.ObjectId,
    filters: PriceAlertFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IPriceAlertItem>>

  findActiveAlertByUserAndProduct(
    userId: string | Types.ObjectId,
    productId: string | Types.ObjectId
  ): Promise<IPriceAlertItem | null>

  createAlert(data: CreatePriceAlertDTO): Promise<IPriceAlertItem>

  deleteAlertByIdAndUser(
    alertId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IPriceAlertItem | null>
}

