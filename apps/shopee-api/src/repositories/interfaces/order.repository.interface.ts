import { Types } from 'mongoose'
import { ClientSession } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'
import {
  IOrder,
  IOrderItem,
  IShippingAddress,
  IShippingMethod,
  OrderStatusType,
  PaymentMethodType,
} from '@database/models/order.model'
import { IOrderTracking } from '@database/models/order-tracking.model'

/**
 * Create order DTO
 */
export interface CreateOrderDTO {
  user: string | Types.ObjectId
  items: IOrderItem[]
  shipping_address: IShippingAddress
  shipping_method: IShippingMethod
  payment_method: PaymentMethodType
  subtotal: number
  shipping_fee: number
  discount: number
  coins_used: number
  coins_discount: number
  total: number
  voucher_code?: string
  note?: string
  status: OrderStatusType
}

/**
 * Order filter options
 */
export interface OrderFilterOptions {
  user_id: string | Types.ObjectId
  status?: OrderStatusType | 'all'
}

/**
 * Order repository interface
 */
export interface IOrderRepository {
  findByUser(
    filters: OrderFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IOrder>>

  findById(orderId: string | Types.ObjectId): Promise<IOrder | null>

  findByIdAndUser(
    orderId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IOrder | null>

  create(data: CreateOrderDTO, options?: { session?: ClientSession }): Promise<IOrder>

  updateStatus(
    orderId: string | Types.ObjectId,
    status: OrderStatusType,
    additionalData?: Partial<IOrder>,
  ): Promise<IOrder | null>

  // Tracking
  findTrackingByOrderAndUser(
    orderId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IOrderTracking | null>

  findTrackingByNumber(trackingNumber: string): Promise<IOrderTracking | null>
}
