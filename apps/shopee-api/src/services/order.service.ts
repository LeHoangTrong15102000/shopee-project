import { Types } from 'mongoose'
import { IOrderRepository, CreateOrderDTO, OrderFilterOptions } from '@repositories/interfaces/order.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import { IProductSkuSnapshotRepository, CreateProductSkuSnapshotDTO } from '@repositories/interfaces/product-sku-snapshot.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'
import { IOrder, ORDER_STATUS, OrderStatusType, PAYMENT_METHOD, PaymentMethodType, IOrderItem, IShippingAddress, IShippingMethod } from '@database/models/order.model'
import { OrderModel } from '@database/models/order.model'
import { IOrderTracking } from '@database/models/order-tracking.model'
import { STATUS_PURCHASE } from '@constants/purchase'
import { validateStatusTransition, validateReturnDeadline } from './order/order_state_machine'
import { STATUS_TO_EVENT, OrderEventType } from './order/order_constants'
import { emitOrderStatusUpdate } from '../socket/utils/order-emit'

const SHIPPING_METHODS = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', price: 30000, estimated_days: '3-5 ngày' },
  { id: 'express', name: 'Giao hàng nhanh', price: 50000, estimated_days: '1-2 ngày' },
  { id: 'same_day', name: 'Giao hàng trong ngày', price: 80000, estimated_days: 'Trong ngày' },
]

const PAYMENT_METHODS = [
  { id: PAYMENT_METHOD.COD, type: PAYMENT_METHOD.COD, name: 'Thanh toán khi nhận hàng (COD)', description: 'Thanh toán bằng tiền mặt khi nhận hàng', icon: '💵', is_available: true },
  { id: PAYMENT_METHOD.BANK_TRANSFER, type: PAYMENT_METHOD.BANK_TRANSFER, name: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản qua tài khoản ngân hàng', icon: '🏦', is_available: true },
  { id: PAYMENT_METHOD.E_WALLET, type: PAYMENT_METHOD.E_WALLET, name: 'Ví điện tử', description: 'Thanh toán qua MoMo, ZaloPay, VNPay', icon: '📱', is_available: true },
  { id: PAYMENT_METHOD.CREDIT_CARD, type: PAYMENT_METHOD.CREDIT_CARD, name: 'Thẻ tín dụng/Ghi nợ', description: 'Visa, Mastercard, JCB', icon: '💳', is_available: true },
]

export interface CreateOrderInput {
  items: Array<{ product_id: string; buy_count: number; sku_id?: string }>
  shipping_address_id: string
  shipping_method_id: string
  payment_method: PaymentMethodType
  voucher_code?: string
  coins_used?: number
  note?: string
}

export class OrderService extends BaseService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly skuRepository?: ISKURepository,
    private readonly productSkuSnapshotRepository?: IProductSkuSnapshotRepository
  ) {
    super()
  }

  getShippingMethods() {
    return SHIPPING_METHODS
  }

  getPaymentMethods() {
    return PAYMENT_METHODS
  }

  async createOrder(userId: string, input: CreateOrderInput): Promise<IOrder> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')

    const address = await this.addressRepository.findByIdAndUser(input.shipping_address_id, userId)
    if (!address) throw new NotFoundError('Address', input.shipping_address_id)

    const shippingMethod = SHIPPING_METHODS.find((m) => m.id === input.shipping_method_id)
    if (!shippingMethod) throw new BusinessError('Phương thức vận chuyển không hợp lệ')

    const orderItems: IOrderItem[] = []
    const snapshotData: CreateProductSkuSnapshotDTO[] = []
    let subtotal = 0

    for (const item of input.items) {
      const product = await this.productRepository.findById(item.product_id)
      if (!product) throw new NotFoundError('Product', item.product_id)

      if (item.sku_id && this.skuRepository) {
        // SKU-based flow: atomic stock decrement
        const sku = await this.skuRepository.findById(item.sku_id)
        if (!sku) throw new NotFoundError('SKU', item.sku_id)

        const decremented = await this.skuRepository.atomicDecrementStock(item.sku_id, item.buy_count)
        if (!decremented) {
          throw new BusinessError(`SKU "${sku.value}" không đủ tồn kho`)
        }

        subtotal += sku.price * item.buy_count
        orderItems.push({
          product: new Types.ObjectId(item.product_id),
          buy_count: item.buy_count,
          price: sku.price,
          price_before_discount: product.price_before_discount,
          sku: new Types.ObjectId(item.sku_id),
        })

        // Prepare snapshot data
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
            order: null, // Will be set after order creation
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
      }
    }

    const shippingFee = shippingMethod.price
    const discount = 0
    const coinsDiscount = input.coins_used || 0
    const total = subtotal + shippingFee - discount - coinsDiscount

    const order = await this.orderRepository.create({
      user: new Types.ObjectId(userId),
      items: orderItems,
      shipping_address: {
        full_name: address.full_name,
        phone: address.phone,
        province: address.province,
        district: address.district,
        ward: address.ward,
        street: address.street,
      },
      shipping_method: shippingMethod as IShippingMethod,
      payment_method: input.payment_method,
      subtotal,
      shipping_fee: shippingFee,
      discount,
      coins_used: input.coins_used || 0,
      coins_discount: coinsDiscount,
      total,
      voucher_code: input.voucher_code,
      note: input.note,
      status: ORDER_STATUS.PENDING,
    })

    // Create snapshots with order reference
    if (this.productSkuSnapshotRepository && snapshotData.length > 0) {
      const orderId = new Types.ObjectId((order as any)._id)
      const snapshotsWithOrder = snapshotData.map((s) => ({ ...s, order: orderId }))
      await this.productSkuSnapshotRepository.createMany(snapshotsWithOrder)
    }

    // Update product stock for legacy (non-SKU) items only
    const legacyItems = input.items.filter((item) => !item.sku_id)
    if (legacyItems.length > 0) {
      const stockUpdates = legacyItems.map((item) => ({
        product_id: item.product_id,
        quantity_change: -item.buy_count,
        sold_change: item.buy_count,
      }))
      await this.productRepository.bulkUpdateStock(stockUpdates)
    }

    // Clear cart items
    for (const item of input.items) {
      await this.purchaseRepository.deleteByUserAndProduct(userId, item.product_id, STATUS_PURCHASE.IN_CART)
    }

    return order
  }

  async getOrders(
    userId: string,
    status: OrderStatusType | 'all' | undefined,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IOrder>> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    return this.orderRepository.findByUser(
      { user_id: userId, status: status || 'all' },
      this.normalizePagination(pagination)
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

    const validation = validateStatusTransition(order.status, ORDER_STATUS.CANCELLED, 'user', { cancelReason: reason })
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    // Restore stock
    for (const item of order.items) {
      const rawProduct = item.product as any
      const productId = rawProduct._id ? rawProduct._id.toString() : rawProduct.toString()

      if (item.sku && this.skuRepository) {
        // SKU-based: restore SKU stock atomically
        const skuId = (item.sku as any)._id ? (item.sku as any)._id.toString() : item.sku.toString()
        await this.skuRepository.atomicIncrementStock(skuId, item.buy_count)
      } else {
        // Legacy: restore product stock
        const product = await this.productRepository.findById(productId)
        if (product) {
          await this.productRepository.updateById(productId, {
            quantity: product.quantity + item.buy_count,
            sold: Math.max(0, product.sold - item.buy_count),
          })
        }
      }
    }

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

    const validation = validateStatusTransition(order.status, ORDER_STATUS.RETURNED, 'user', { returnReason: reason })
    if (!validation.valid) {
      throw new BusinessError(validation.message!)
    }

    const deadlineCheck = validateReturnDeadline(order.delivered_at, 'user')
    if (!deadlineCheck.valid) {
      throw new BusinessError(deadlineCheck.message!)
    }

    // Restore stock (matching cancelOrder pattern)
    for (const item of order.items) {
      const rawProduct = item.product as any
      const productId = rawProduct._id ? rawProduct._id.toString() : rawProduct.toString()

      if (item.sku && this.skuRepository) {
        const skuId = (item.sku as any)._id ? (item.sku as any)._id.toString() : item.sku.toString()
        await this.skuRepository.atomicIncrementStock(skuId, item.buy_count)
      } else {
        const product = await this.productRepository.findById(productId)
        if (product) {
          await this.productRepository.updateById(productId, {
            quantity: product.quantity + item.buy_count,
            sold: Math.max(0, product.sold - item.buy_count),
          })
        }
      }
    }

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
    options?: { reason?: string }
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
      for (const item of order.items) {
        const rawProduct = item.product as any
        const productId = rawProduct._id ? rawProduct._id.toString() : rawProduct.toString()

        if (item.sku && this.skuRepository) {
          const skuId = (item.sku as any)._id ? (item.sku as any)._id.toString() : item.sku.toString()
          await this.skuRepository.atomicIncrementStock(skuId, item.buy_count)
        } else {
          const product = await this.productRepository.findById(productId)
          if (product) {
            await this.productRepository.updateById(productId, {
              quantity: product.quantity + item.buy_count,
              sold: Math.max(0, product.sold - item.buy_count),
            })
          }
        }
      }
    }

    const updatedOrder = await this.orderRepository.updateStatus(orderId, targetStatus, additionalData)

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
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' }
  ) {
    return (this.orderRepository as any).findAllWithFilters(filters, pagination)
  }

  // ─── Admin: Bulk Update Status ─────────────────────────────────

  async adminBulkUpdateStatus(
    orderIds: string[],
    targetStatus: OrderStatusType,
    reason?: string
  ) {
    const results = { success: 0, failed: 0, errors: [] as Array<{ order_id: string; message: string }> }

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
    const counts = await OrderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

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
}

