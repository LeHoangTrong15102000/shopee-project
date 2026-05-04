import { Types } from 'mongoose'
import { ClientSession } from 'mongoose'
import {
  IOrderRepository,
  CreateOrderDTO,
  OrderFilterOptions,
} from '@repositories/interfaces/order.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import {
  IProductSkuSnapshotRepository,
  CreateProductSkuSnapshotDTO,
} from '@repositories/interfaces/product-sku-snapshot.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'
import {
  IOrder,
  ORDER_STATUS,
  OrderStatusType,
  PAYMENT_METHOD,
  PaymentMethodType,
  IOrderItem,
  IShippingAddress,
  IShippingMethod,
} from '@database/models/order.model'
import { OrderModel } from '@database/models/order.model'
import { IOrderTracking } from '@database/models/order-tracking.model'
import { STATUS_PURCHASE } from '@constants/purchase'
import { validateStatusTransition, validateReturnDeadline } from './order/order_state_machine'
import { STATUS_TO_EVENT, OrderEventType } from './order/order_constants'
import { emitOrderStatusUpdate } from '../socket/utils/order-emit'
import { withTransaction } from '@utils/transaction.helper'
import { Logger } from '@utils/logger'

const SHIPPING_METHODS = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', price: 30000, estimated_days: '3-5 ngày' },
  { id: 'express', name: 'Giao hàng nhanh', price: 50000, estimated_days: '1-2 ngày' },
  { id: 'same_day', name: 'Giao hàng trong ngày', price: 80000, estimated_days: 'Trong ngày' },
]

const PAYMENT_METHODS = [
  {
    id: PAYMENT_METHOD.COD,
    type: PAYMENT_METHOD.COD,
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: '💵',
    is_available: true,
  },
  {
    id: PAYMENT_METHOD.BANK_TRANSFER,
    type: PAYMENT_METHOD.BANK_TRANSFER,
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản qua tài khoản ngân hàng',
    icon: '🏦',
    is_available: true,
  },
  {
    id: PAYMENT_METHOD.E_WALLET,
    type: PAYMENT_METHOD.E_WALLET,
    name: 'Ví điện tử',
    description: 'Thanh toán qua MoMo, ZaloPay, VNPay',
    icon: '📱',
    is_available: true,
  },
  {
    id: PAYMENT_METHOD.CREDIT_CARD,
    type: PAYMENT_METHOD.CREDIT_CARD,
    name: 'Thẻ tín dụng/Ghi nợ',
    description: 'Visa, Mastercard, JCB',
    icon: '💳',
    is_available: true,
  },
]

export interface CreateOrderInput {
  items: Array<{ product_id: string; buy_count: number; sku_id?: string }>
  shipping_address_id: string
  shipping_method_id: string
  payment_method: PaymentMethodType
  voucher_code?: string
  voucher_discount?: number
  coins_used?: number
  note?: string
}

// Shape returned by validateOrderInput — all expensive lookups happen before the transaction.
interface ValidatedInput {
  address: {
    full_name: string
    phone: string
    province: string
    district: string
    ward: string
    street: string
  }
  shippingMethod: IShippingMethod
  orderItems: IOrderItem[]
  snapshotData: CreateProductSkuSnapshotDTO[]
  skuItems: Array<{ skuId: string; quantity: number; productName: string; skuValue: string; skuStock: number }>
  legacyItems: Array<{ product_id: string; buy_count: number }>
  subtotal: number
  productIds: string[]
  shippingFee: number
  discount: number
  coinsDiscount: number
  total: number
  paymentMethod: PaymentMethodType
  voucher_code?: string
  note?: string
  coinsUsed: number
}

export class OrderService extends BaseService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly skuRepository?: ISKURepository,
    private readonly productSkuSnapshotRepository?: IProductSkuSnapshotRepository,
  ) {
    super()
  }

  getShippingMethods() {
    return SHIPPING_METHODS
  }

  getPaymentMethods() {
    return PAYMENT_METHODS
  }

  // ─── Public createOrder — orchestration only ──────────────────────────────

  async createOrder(userId: string, input: CreateOrderInput): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')

    const correlationId = `order-${userId}-${Date.now()}`
    const startTime = Date.now()

    // Validation runs BEFORE the transaction — fail fast on bad input, no wasted transaction slot.
    const validated = await this.validateOrderInput(userId, input)

    Logger.dbInfo('[Order.Transaction] Starting transaction', { correlationId })

    try {
      const order = await withTransaction(async (session) => {
        Logger.dbInfo('[Order.Transaction] Transaction started', { correlationId })

        // SKU flow: bulk decrement SKU stock (also syncs Product.quantity)
        if (validated.skuItems.length > 0) {
          await this.reserveStock(validated.skuItems, session)
        }

        // Legacy flow: bulk update product stock + sold in transaction
        if (validated.legacyItems.length > 0) {
          await this.updateLegacyStock(validated.legacyItems, session)
        }

        // Create order document
        const createdOrder = await this.persistOrder(validated, userId, session)

        // Create SKU snapshots (SKU flow only)
        if (validated.snapshotData.length > 0) {
          await this.snapshotSkus(createdOrder._id, validated.snapshotData, session)
        }

        // Update Product.sold for SKU items (Product.quantity already synced at reserveStock)
        if (validated.skuItems.length > 0) {
          await this.incrementSoldCounters(validated.skuItems, input.items, session)
        }

        // Clear cart items — 1 DB call instead of N
        await this.clearCartItems(userId, validated.productIds, session)

        Logger.dbInfo('[Order.Transaction] Transaction committing', {
          correlationId,
          orderId: String(createdOrder._id),
        })

        return createdOrder
      })

      const duration = Date.now() - startTime
      Logger.apiInfo('[Order] order.created', {
        correlationId,
        orderId: String(order._id),
        userId,
        duration_ms: duration,
        itemCount: input.items.length,
      })
      Logger.performance('order.create.duration', duration, { correlationId, userId })

      return order
    } catch (err) {
      const duration = Date.now() - startTime
      Logger.apiError('[Order] order.creation_failed', {
        correlationId,
        userId,
        duration_ms: duration,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  // ─── Private helper methods ───────────────────────────────────────────────

  /**
   * Validate address, shipping method, products, and SKUs.
   * Runs OUTSIDE the transaction — expensive reads should not hold locks.
   */
  private async validateOrderInput(userId: string, input: CreateOrderInput): Promise<ValidatedInput> {
    const address = await this.addressRepository.findByIdAndUser(input.shipping_address_id, userId)
    if (!address) throw new NotFoundError('Address', input.shipping_address_id)

    const shippingMethod = SHIPPING_METHODS.find((m) => m.id === input.shipping_method_id)
    if (!shippingMethod) throw new BusinessError('Phương thức vận chuyển không hợp lệ')

    const orderItems: IOrderItem[] = []
    const snapshotData: CreateProductSkuSnapshotDTO[] = []
    let subtotal = 0

    const skuItems: Array<{
      skuId: string
      quantity: number
      productName: string
      skuValue: string
      skuStock: number
    }> = []

    const legacyItems: Array<{ product_id: string; buy_count: number }> = []
    const productIds: string[] = []

    for (const item of input.items) {
      const product = await this.productRepository.findById(item.product_id)
      if (!product) throw new NotFoundError('Product', item.product_id)

      productIds.push(item.product_id)

      if (item.sku_id && this.skuRepository) {
        // SKU-based flow
        const sku = await this.skuRepository.findById(item.sku_id)
        if (!sku) throw new NotFoundError('SKU', item.sku_id)

        skuItems.push({
          skuId: item.sku_id,
          quantity: item.buy_count,
          productName: product.name,
          skuValue: sku.value,
          skuStock: sku.stock,
        })

        subtotal += sku.price * item.buy_count
        orderItems.push({
          product: new Types.ObjectId(item.product_id),
          buy_count: item.buy_count,
          price: sku.price,
          price_before_discount: product.price_before_discount,
          sku: new Types.ObjectId(item.sku_id),
        })

        if (this.productSkuSnapshotRepository) {
          snapshotData.push({
            product_name: product.name,
            product_image: product.image || '',
            sku_price: sku.price,
            sku_value: sku.value,
            sku_image: sku.image || '',
            variant_values: (sku.variant_values as Record<string, string>) || {},
            quantity: item.buy_count,
            sku: new Types.ObjectId(item.sku_id),
            product: new Types.ObjectId(item.product_id),
            order: null, // Set after order is created
          })
        }
      } else {
        // Legacy flow: product-based stock
        if (product.quantity < item.buy_count) {
          throw new BusinessError(`Sản phẩm "${product.name}" không đủ số lượng`)
        }

        subtotal += product.price * item.buy_count
        orderItems.push({
          product: new Types.ObjectId(item.product_id),
          buy_count: item.buy_count,
          price: product.price,
          price_before_discount: product.price_before_discount,
        })

        legacyItems.push({ product_id: item.product_id, buy_count: item.buy_count })
      }
    }

    const shippingFee = shippingMethod.price
    const discount = input.voucher_discount || 0
    const coinsDiscount = input.coins_used || 0
    const total = Math.max(0, subtotal + shippingFee - discount - coinsDiscount)

    return {
      address: {
        full_name: address.full_name,
        phone: address.phone,
        province: address.province,
        district: address.district,
        ward: address.ward,
        street: address.street,
      },
      shippingMethod: shippingMethod as IShippingMethod,
      orderItems,
      snapshotData,
      skuItems,
      legacyItems,
      subtotal,
      productIds,
      shippingFee,
      discount,
      coinsDiscount,
      total,
      paymentMethod: input.payment_method,
      voucher_code: input.voucher_code,
      note: input.note,
      coinsUsed: input.coins_used || 0,
    }
  }

  /**
   * Bulk decrement SKU stock inside transaction.
   * Also syncs Product.quantity via SKU repository.
   */
  private async reserveStock(
    skuItems: Array<{ skuId: string; quantity: number; productName: string; skuValue: string; skuStock: number }>,
    session: ClientSession,
  ): Promise<void> {
    if (!this.skuRepository) return
    try {
      await this.skuRepository.bulkAtomicDecrementStock(
        skuItems.map((s) => ({ skuId: s.skuId, quantity: s.quantity })),
        { session },
      )
    } catch (err) {
      if (err instanceof BusinessError) {
        const failingSku = skuItems.find((s) => err.message.includes(s.skuId))
        if (failingSku) {
          throw new BusinessError(
            `Sản phẩm ${failingSku.productName} - ${failingSku.skuValue} không đủ số lượng (còn ${failingSku.skuStock}, cần ${failingSku.quantity})`,
          )
        }
      }
      throw err
    }
  }

  /**
   * Bulk update product stock for legacy (non-SKU) items inside transaction.
   */
  private async updateLegacyStock(
    legacyItems: Array<{ product_id: string; buy_count: number }>,
    session: ClientSession,
  ): Promise<void> {
    const stockUpdates = legacyItems.map((item) => ({
      product_id: item.product_id,
      quantity_change: -item.buy_count,
      sold_change: item.buy_count,
    }))
    await this.productRepository.bulkUpdateStock(stockUpdates, { session })
  }

  /**
   * Create the order document inside transaction.
   */
  private async persistOrder(
    validated: ValidatedInput,
    userId: string,
    session: ClientSession,
  ): Promise<IOrder> {
    return this.orderRepository.create(
      {
        user: new Types.ObjectId(userId),
        items: validated.orderItems,
        shipping_address: validated.address,
        shipping_method: validated.shippingMethod,
        payment_method: validated.paymentMethod,
        subtotal: validated.subtotal,
        shipping_fee: validated.shippingFee,
        discount: validated.discount,
        coins_used: validated.coinsUsed,
        coins_discount: validated.coinsDiscount,
        total: validated.total,
        voucher_code: validated.voucher_code,
        note: validated.note,
        status: ORDER_STATUS.PENDING,
      },
      { session },
    )
  }

  /**
   * Create SKU snapshots with order reference inside transaction.
   */
  private async snapshotSkus(
    orderId: any,
    snapshotData: CreateProductSkuSnapshotDTO[],
    session: ClientSession,
  ): Promise<void> {
    if (!this.productSkuSnapshotRepository) return
    const orderObjectId = new Types.ObjectId(orderId)
    const snapshotsWithOrder = snapshotData.map((s) => ({ ...s, order: orderObjectId }))
    await this.productSkuSnapshotRepository.createMany(snapshotsWithOrder, { session })
  }

  /**
   * Increment Product.sold for SKU items inside transaction.
   * Error propagates — transaction will abort and roll back entire order.
   */
  private async incrementSoldCounters(
    skuItems: Array<{ skuId: string; quantity: number }>,
    inputItems: Array<{ product_id: string; sku_id?: string }>,
    session: ClientSession,
  ): Promise<void> {
    const soldByProduct = new Map<string, number>()
    for (const item of skuItems) {
      const productId = inputItems.find((i) => i.sku_id === item.skuId)!.product_id
      soldByProduct.set(productId, (soldByProduct.get(productId) || 0) + item.quantity)
    }
    for (const [productId, soldCount] of soldByProduct) {
      // No try/catch — errors propagate and abort the entire transaction (task 6).
      await this.productRepository.incrementSold(productId, soldCount, { session })
    }
  }

  /**
   * Delete cart items for the given products — single bulk DB call (task 5).
   */
  private async clearCartItems(
    userId: string,
    productIds: string[],
    session: ClientSession,
  ): Promise<void> {
    await this.purchaseRepository.deleteManyByUserAndProducts(
      userId,
      productIds,
      STATUS_PURCHASE.IN_CART,
      { session },
    )
  }

  // ─── Remaining public methods (unchanged behavior) ─────────────────────────

  async getOrders(
    userId: string,
    status: OrderStatusType | 'all' | undefined,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IOrder>> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    return this.orderRepository.findByUser(
      { user_id: userId, status: status || 'all' },
      this.normalizePagination(pagination),
    )
  }

  async getOrderById(userId: string, orderId: string): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findByIdAndUser(orderId, userId)
    if (!order) throw new NotFoundError('Order', orderId)
    return order
  }

  async cancelOrder(userId: string, orderId: string, reason?: string): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findByIdAndUser(orderId, userId)
    if (!order) throw new NotFoundError('Order', orderId)

    const validation = validateStatusTransition(order.status, ORDER_STATUS.CANCELLED, 'user', {
      cancelReason: reason,
    })
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    // Restore stock
    await this.restoreOrderStock(order.items)

    const updatedOrder = await this.orderRepository.updateStatus(orderId, ORDER_STATUS.CANCELLED, {
      cancel_reason: reason,
      cancelled_at: new Date(),
    })

    emitOrderStatusUpdate(orderId, order.status, ORDER_STATUS.CANCELLED)

    return updatedOrder!
  }

  async confirmReceived(userId: string, orderId: string): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findByIdAndUser(orderId, userId)
    if (!order) throw new NotFoundError('Order', orderId)

    const validation = validateStatusTransition(order.status, ORDER_STATUS.DELIVERED, 'user')
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    const updatedOrder = await this.orderRepository.updateStatus(orderId, ORDER_STATUS.DELIVERED, {
      delivered_at: new Date(),
    })

    emitOrderStatusUpdate(orderId, order.status, ORDER_STATUS.DELIVERED)

    return updatedOrder!
  }

  async returnOrder(userId: string, orderId: string, reason: string): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findByIdAndUser(orderId, userId)
    if (!order) throw new NotFoundError('Order', orderId)

    const validation = validateStatusTransition(order.status, ORDER_STATUS.RETURNED, 'user', {
      returnReason: reason,
    })
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    const deadlineCheck = validateReturnDeadline(order.delivered_at, 'user')
    if (!deadlineCheck.valid) {
      throw new BusinessError(deadlineCheck.message!)
    }

    // Restore stock
    await this.restoreOrderStock(order.items)

    const updatedOrder = await this.orderRepository.updateStatus(orderId, ORDER_STATUS.RETURNED, {
      returned_at: new Date(),
      return_reason: reason,
    })

    emitOrderStatusUpdate(orderId, order.status, ORDER_STATUS.RETURNED)

    return updatedOrder!
  }

  async adminUpdateStatus(
    orderId: string,
    targetStatus: OrderStatusType,
    options?: { reason?: string },
  ): Promise<IOrder> {
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order', orderId)

    const validation = validateStatusTransition(order.status, targetStatus, 'admin', {
      cancelReason: options?.reason,
      returnReason: options?.reason,
    })
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    // Build additional data based on target status
    const additionalData: Partial<IOrder> = {}
    const now = new Date()

    switch (targetStatus) {
      case ORDER_STATUS.CONFIRMED:
        additionalData.confirmed_at = now
        break
      case ORDER_STATUS.PROCESSING:
        additionalData.processing_at = now
        break
      case ORDER_STATUS.SHIPPING:
        additionalData.shipped_at = now
        break
      case ORDER_STATUS.DELIVERED:
        additionalData.delivered_at = now
        break
      case ORDER_STATUS.CANCELLED:
        additionalData.cancelled_at = now
        additionalData.cancel_reason = options?.reason
        break
      case ORDER_STATUS.RETURNED:
        additionalData.returned_at = now
        additionalData.return_reason = options?.reason
        break
    }

    // Restore stock on cancel or return
    if (targetStatus === ORDER_STATUS.CANCELLED || targetStatus === ORDER_STATUS.RETURNED) {
      await this.restoreOrderStock(order.items)
    }

    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      targetStatus,
      additionalData,
    )

    emitOrderStatusUpdate(orderId, order.status, targetStatus)

    return updatedOrder!
  }

  async adminGetOrder(orderId: string): Promise<IOrder> {
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const order = await this.orderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order', orderId)
    return order
  }

  async getTracking(userId: string, orderId: string): Promise<IOrderTracking> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(orderId)) throw new ValidationError('Invalid order ID format')

    const tracking = await this.orderRepository.findTrackingByOrderAndUser(orderId, userId)
    if (!tracking) throw new NotFoundError('Tracking', orderId)
    return tracking
  }

  async getTrackingByNumber(trackingNumber: string): Promise<IOrderTracking> {
    if (!trackingNumber) throw new ValidationError('Số tracking là bắt buộc')

    const tracking = await this.orderRepository.findTrackingByNumber(trackingNumber)
    if (!tracking) throw new NotFoundError('Tracking', trackingNumber)
    return tracking
  }

  // ─── Admin: Order List with Filters ────────────────────────────

  async adminGetOrders(
    filters: {
      status?: string
      payment_method?: string
      user_id?: string
      search?: string
      start_date?: string
      end_date?: string
    },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ) {
    return (this.orderRepository as any).findAllWithFilters(filters, pagination)
  }

  // ─── Admin: Bulk Update Status ─────────────────────────────────

  async adminBulkUpdateStatus(orderIds: string[], targetStatus: OrderStatusType, reason?: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ order_id: string; message: string }>,
    }

    for (const orderId of orderIds) {
      try {
        await this.adminUpdateStatus(orderId, targetStatus, { reason })
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push({ order_id: orderId, message: error.message || 'Unknown error' })
      }
    }

    return results
  }

  // ─── Admin: Count by Status ────────────────────────────────────

  async adminGetOrderCountByStatus() {
    const counts = await OrderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])

    const total = await OrderModel.countDocuments()

    const statusMap: Record<string, number> = { total }
    for (const status of Object.values(ORDER_STATUS)) {
      statusMap[status] = 0
    }
    for (const item of counts) {
      statusMap[item._id] = item.count
    }

    return statusMap
  }

  /**
   * Restore stock for all items in an order (used by cancel/return flows).
   * SKU items: uses atomicIncrementStock which also syncs Product.quantity, then decrements Product.sold.
   * Legacy items: uses bulkUpdateStock with $inc for atomic updates.
   */
  private async restoreOrderStock(items: IOrderItem[]): Promise<void> {
    const legacyUpdates: Array<{
      product_id: string
      quantity_change: number
      sold_change: number
    }> = []
    const skuSoldByProduct = new Map<string, number>()

    for (const item of items) {
      const rawProduct = item.product as any
      const productId = rawProduct._id ? rawProduct._id.toString() : rawProduct.toString()

      if (item.sku && this.skuRepository) {
        // SKU-based: restore SKU stock atomically (also syncs Product.quantity)
        const skuId = (item.sku as any)._id ? (item.sku as any)._id.toString() : item.sku.toString()
        await this.skuRepository.atomicIncrementStock(skuId, item.buy_count)
        // Track sold to decrement
        skuSoldByProduct.set(productId, (skuSoldByProduct.get(productId) || 0) + item.buy_count)
      } else {
        // Legacy: collect for bulk atomic update
        legacyUpdates.push({
          product_id: productId,
          quantity_change: item.buy_count,
          sold_change: -item.buy_count,
        })
      }
    }

    if (legacyUpdates.length > 0) {
      await this.productRepository.bulkUpdateStock(legacyUpdates)
    }

    // Decrement Product.sold for SKU items
    for (const [productId, soldCount] of skuSoldByProduct) {
      try {
        await this.productRepository.incrementSold(productId, -soldCount)
      } catch (err) {
        Logger.dbError(
          `[Product.sold Sync Failed] Product ${productId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
      }
    }
  }
}
