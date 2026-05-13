import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import { PaymentRepository } from '@repositories/payment.repository'
import { OrderModel, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@database/models/order.model'
import { GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import {
  PaymentSessionModel,
  PAYMENT_SESSION_STATUS,
  IPaymentSession,
} from '@database/models/payment-session.model'
import { IPaymentProvider, PaymentProvider, PaymentStatus } from './payment/payment.interface'
import { MomoProvider } from './payment/momo.provider'
import { VnpayProvider } from './payment/vnpay.provider'
import { emitToUser } from '../socket/utils/emit'
import { SocketEvent } from '../@types/socket.type'
import { Logger } from '@utils/logger'
import {
  incrementInitiated,
  incrementIpnReceived,
  incrementSuccess,
  incrementFailed,
} from '@utils/payment-metrics'

// Session prefix used to distinguish session-based IPN orderId values from real order IDs
const SESSION_ID_PREFIX = 'session_'

const PAYMENT_SESSION_TTL_MINUTES = 15

export interface CreatePaymentSessionInput {
  cartItems: Array<{
    productId: string
    skuId?: string
    buyCount: number
    price: number
  }>
  shippingAddressId: string
  shippingMethodId: string
  paymentMethod: string
  eWalletProvider: string
  voucherCode?: string
  coinsUsed?: number
  note?: string
  amount: number
  clientIp: string
}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

export class PaymentService {
  private readonly momoProvider: MomoProvider
  private readonly vnpayProvider: VnpayProvider

  constructor(private readonly paymentRepository: PaymentRepository) {
    this.momoProvider = new MomoProvider()
    this.vnpayProvider = new VnpayProvider()
  }

  getProvider(method: PaymentProvider): IPaymentProvider {
    switch (method) {
      case PaymentProvider.MOMO:
        return this.momoProvider
      case PaymentProvider.VNPAY:
        return this.vnpayProvider
      default:
        throw new Error(`Unsupported payment provider: ${method}`)
    }
  }

  /**
   * Create a PaymentSession for e-wallet (MoMo/VNPay) payments.
   * Does NOT create an order — order is created only after IPN success.
   * Returns { sessionId, payment_url } for frontend redirect.
   */
  async createPaymentSession(
    userId: string,
    input: CreatePaymentSessionInput,
  ): Promise<{ sessionId: string; payment_url: string }> {
    incrementInitiated()

    const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MINUTES * 60 * 1000)

    const session = await PaymentSessionModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      cartItems: input.cartItems.map((item) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        skuId: item.skuId ? new mongoose.Types.ObjectId(item.skuId) : undefined,
        buyCount: item.buyCount,
        price: item.price,
      })),
      shippingAddressId: new mongoose.Types.ObjectId(input.shippingAddressId),
      shippingMethodId: input.shippingMethodId,
      paymentMethod: input.paymentMethod,
      eWalletProvider: input.eWalletProvider,
      voucherCode: input.voucherCode,
      coinsUsed: input.coinsUsed || 0,
      note: input.note,
      amount: input.amount,
      status: PAYMENT_SESSION_STATUS.PENDING,
      expiresAt,
    })

    const sessionId = session._id.toString()

    // Use SESSION_ID_PREFIX + sessionId as the orderId sent to the provider
    // so IPN handler can distinguish session-based from order-based callbacks
    const providerOrderId = `${SESSION_ID_PREFIX}${sessionId}`

    const provider = input.eWalletProvider.toUpperCase() as PaymentProvider
    const providerInstance = this.getProvider(provider)

    const requestId = uuidv4()
    const idempotencyKey = `session-${sessionId}-${requestId}`
    const ipnUrl = `${APP_BASE_URL}/payment/${input.eWalletProvider.toLowerCase()}/ipn`
    const returnUrl = `${FRONTEND_URL}/payment/return?provider=${input.eWalletProvider.toLowerCase()}&sessionId=${sessionId}`
    const orderInfo = `Thanh toan don hang #${sessionId}`

    // Create payment record linked to session (no orderId yet)
    const paymentRecord = await this.paymentRepository.create({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      provider: provider as any,
      amount: input.amount,
      currency: 'VND',
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      idempotencyKey,
      requestPayload: { requestId, ipnUrl, returnUrl },
    })

    Logger.apiInfo('[Payment] Creating payment session', {
      sessionId,
      provider: input.eWalletProvider,
      amount: input.amount,
      paymentId: paymentRecord._id.toString(),
    })

    let paymentUrl: string
    try {
      const result = await providerInstance.createPayment({
        orderId: providerOrderId,
        amount: input.amount,
        orderInfo,
        returnUrl,
        ipnUrl,
        clientIp: input.clientIp,
        requestId,
      })

      paymentUrl = result.paymentUrl

      await this.paymentRepository.updateById(paymentRecord._id, {
        transactionId: result.transactionId,
        responsePayload: result as unknown as Record<string, unknown>,
      })
    } catch (err) {
      await this.paymentRepository.updateById(paymentRecord._id, {
        status: GATEWAY_PAYMENT_STATUS.FAILED,
      })
      await PaymentSessionModel.findByIdAndUpdate(sessionId, {
        status: PAYMENT_SESSION_STATUS.FAILED,
      })
      throw err
    }

    // Store payment_url and payment_id on the session
    await PaymentSessionModel.findByIdAndUpdate(sessionId, {
      payment_url: paymentUrl,
      payment_id: paymentRecord._id.toString(),
    })

    Logger.apiInfo('[Payment] Payment session created', {
      sessionId,
      provider: input.eWalletProvider,
      paymentId: paymentRecord._id.toString(),
    })

    return { sessionId, payment_url: paymentUrl }
  }

  /**
   * Get the current status of a PaymentSession.
   * Returns { status, orderId? } — orderId is present only after IPN success creates the order.
   */
  async getSessionStatus(
    sessionId: string,
    userId: string,
  ): Promise<{ status: string; orderId?: string }> {
    const session = await PaymentSessionModel.findById(sessionId).lean<IPaymentSession>()

    if (!session) {
      const err = new Error(`Payment session not found: ${sessionId}`)
      ;(err as any).statusCode = 404
      throw err
    }

    if (session.userId.toString() !== userId) {
      const err = new Error(`Payment session not found: ${sessionId}`)
      ;(err as any).statusCode = 404
      throw err
    }

    // Look up the order that references this session (if IPN has already created it)
    const order = await OrderModel.findOne({
      payment_session_id: new mongoose.Types.ObjectId(sessionId),
    })
      .select('_id')
      .lean()

    return {
      status: session.status,
      orderId: order ? order._id.toString() : undefined,
    }
  }

  /**
   * Initiate a payment for an order.
   * Idempotent: if a PENDING payment already exists for this order, returns it.
   */
  async initiatePayment(
    orderId: string,
    provider: PaymentProvider,
    clientIp: string,
  ): Promise<{ paymentUrl: string; paymentId: string }> {
    incrementInitiated()
    const order = await OrderModel.findById(orderId).lean()
    if (!order) throw new Error(`Order not found: ${orderId}`)

    // Idempotency: return existing PENDING payment if present
    const existing = await this.paymentRepository.findPendingByOrderId(orderId)
    if (existing && existing.status === GATEWAY_PAYMENT_STATUS.PENDING) {
      Logger.apiInfo('[Payment] Returning existing pending payment', {
        orderId,
        paymentId: existing._id.toString(),
      })
      // payment_url may already be set on order
      const existingOrder = await OrderModel.findById(orderId).select('payment_url').lean()
      return {
        paymentUrl: existingOrder?.payment_url || '',
        paymentId: existing._id.toString(),
      }
    }

    const requestId = uuidv4()
    const idempotencyKey = `${orderId}-${requestId}`

    const ipnUrl = `${APP_BASE_URL}/payment/${provider.toLowerCase()}/ipn`
    const returnUrl = `${FRONTEND_URL}/payment/return?provider=${provider.toLowerCase()}`
    const orderInfo = `Thanh toan don hang #${orderId}`

    const paymentRecord = await this.paymentRepository.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      provider,
      amount: order.total,
      currency: 'VND',
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      idempotencyKey,
      requestPayload: { requestId, ipnUrl, returnUrl },
    })

    Logger.apiInfo('[Payment] Initiating payment', {
      orderId,
      provider,
      amount: order.total,
      paymentId: paymentRecord._id.toString(),
    })

    let paymentUrl: string
    try {
      const providerInstance = this.getProvider(provider)
      const result = await providerInstance.createPayment({
        orderId,
        amount: order.total,
        orderInfo,
        returnUrl,
        ipnUrl,
        clientIp,
        requestId,
      })

      paymentUrl = result.paymentUrl

      // Update payment record with response
      await this.paymentRepository.updateById(paymentRecord._id, {
        transactionId: result.transactionId,
        responsePayload: result as unknown as Record<string, unknown>,
      })
    } catch (err) {
      // Mark payment as failed if provider call fails
      await this.paymentRepository.updateById(paymentRecord._id, {
        status: GATEWAY_PAYMENT_STATUS.FAILED,
      })
      throw err
    }

    // Update order: set payment_pending status and store payment_url + payment_id
    await OrderModel.findByIdAndUpdate(orderId, {
      status: ORDER_STATUS.PAYMENT_PENDING,
      payment_id: paymentRecord._id,
      payment_url: paymentUrl,
    })

    Logger.apiInfo('[Payment] Payment initiated', {
      orderId,
      provider,
      paymentId: paymentRecord._id.toString(),
    })

    return {
      paymentUrl,
      paymentId: paymentRecord._id.toString(),
    }
  }

  /**
   * Handle IPN callback from payment provider.
   * Detects session-based vs order-based payments by the orderId prefix.
   * Uses Mongoose transaction to prevent race conditions on duplicate IPN delivery.
   */
  async handleIpn(
    provider: PaymentProvider,
    payload: Record<string, unknown>,
  ): Promise<void> {
    incrementIpnReceived()
    const providerInstance = this.getProvider(provider)

    // Verify signature — reject if invalid
    if (!providerInstance.verifyIpn(payload)) {
      Logger.apiWarn('[Payment] IPN signature verification failed', { provider, payload })
      throw new Error('IPN signature verification failed')
    }

    const ipnResult = providerInstance.parseIpnResult(payload)

    Logger.apiInfo('[Payment] IPN received', {
      provider,
      orderId: ipnResult.orderId,
      transactionId: ipnResult.transactionId,
      success: ipnResult.success,
      resultCode: ipnResult.resultCode,
    })

    // Detect session-based IPN: orderId starts with SESSION_ID_PREFIX
    if (ipnResult.orderId.startsWith(SESSION_ID_PREFIX)) {
      const sessionId = ipnResult.orderId.slice(SESSION_ID_PREFIX.length)
      await this.handleSessionIpn(provider, ipnResult, sessionId)
      return
    }

    // Legacy order-based IPN path
    await this.handleOrderIpn(provider, ipnResult)
  }

  /**
   * Handle IPN for session-based (e-wallet) payments.
   * On success: calls orderService.createOrderFromSession, marks session PAID.
   * On failure: marks session FAILED.
   */
  private async handleSessionIpn(
    provider: PaymentProvider,
    ipnResult: import('./payment/payment.interface').IpnResult,
    sessionId: string,
  ): Promise<void> {
    const mongoSession = await mongoose.startSession()
    try {
      await mongoSession.withTransaction(async () => {
        const paymentSession = await PaymentSessionModel.findById(sessionId)
          .session(mongoSession)
          .lean<IPaymentSession>()

        if (!paymentSession) {
          Logger.apiWarn('[Payment] Session IPN: session not found', { sessionId, provider })
          return
        }

        // Idempotency: if already PAID or FAILED, skip
        if (
          paymentSession.status === PAYMENT_SESSION_STATUS.PAID ||
          paymentSession.status === PAYMENT_SESSION_STATUS.FAILED
        ) {
          Logger.apiInfo('[Payment] Session IPN already processed (idempotency)', {
            sessionId,
            status: paymentSession.status,
          })
          return
        }

        // Validate amount matches session amount (allow ±1 VND tolerance)
        if (Math.abs(ipnResult.amount - paymentSession.amount) > 1) {
          Logger.apiWarn('[Payment] Session IPN amount mismatch — possible tampering', {
            sessionId,
            ipnAmount: ipnResult.amount,
            sessionAmount: paymentSession.amount,
          })
          const payment = await this.paymentRepository.findBySessionId(sessionId)
          if (payment) {
            await this.paymentRepository.updateById(payment._id, {
              status: GATEWAY_PAYMENT_STATUS.FAILED,
              ipnPayload: ipnResult.rawData,
            })
          }
          await PaymentSessionModel.findByIdAndUpdate(sessionId, {
            status: PAYMENT_SESSION_STATUS.FAILED,
          }).session(mongoSession)
          incrementFailed()
          return
        }

        // Find the payment record linked to this session
        const payment = await this.paymentRepository.findBySessionId(sessionId)

        if (payment) {
          await this.paymentRepository.updateById(payment._id, {
            status: ipnResult.success
              ? GATEWAY_PAYMENT_STATUS.SUCCESS
              : GATEWAY_PAYMENT_STATUS.FAILED,
            transactionId: ipnResult.transactionId,
            ipnPayload: ipnResult.rawData,
          })
        }

        if (ipnResult.success) {
          incrementSuccess()

          // Mark session as PAID
          await PaymentSessionModel.findByIdAndUpdate(sessionId, {
            status: PAYMENT_SESSION_STATUS.PAID,
            provider_transaction_id: ipnResult.transactionId,
          }).session(mongoSession)

          Logger.apiInfo('[Payment] Session IPN success — creating order from session', {
            sessionId,
            provider,
          })

          // Create order from session (runs its own transaction internally)
          // We do this outside the current transaction to avoid nested transactions
          // The createOrderFromSession method has its own idempotency check
          setImmediate(async () => {
            try {
              const { orderService } = require('../container')
              await orderService.createOrderFromSession(sessionId)
            } catch (err) {
              Logger.apiError('[Payment] Failed to create order from session after IPN', {
                sessionId,
                error: err instanceof Error ? err.message : String(err),
              })
            }
          })
        } else {
          incrementFailed()

          // Mark session as FAILED
          await PaymentSessionModel.findByIdAndUpdate(sessionId, {
            status: PAYMENT_SESSION_STATUS.FAILED,
          }).session(mongoSession)

          Logger.apiInfo('[Payment] Session IPN failed', {
            sessionId,
            provider,
            resultCode: ipnResult.resultCode,
          })
        }
      })
    } finally {
      await mongoSession.endSession()
    }
  }

  /**
   * Handle IPN for legacy order-based payments (Stripe/COD path — kept for backward compat).
   */
  private async handleOrderIpn(
    provider: PaymentProvider,
    ipnResult: import('./payment/payment.interface').IpnResult,
  ): Promise<void> {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        // Find the payment record by orderId (most recent)
        const payment = await this.paymentRepository.findLatestByOrderId(ipnResult.orderId)

        if (!payment) {
          Logger.apiWarn('[Payment] IPN received for unknown order', {
            orderId: ipnResult.orderId,
            provider,
          })
          return
        }

        // Idempotency: if already SUCCESS, skip processing
        if (payment.status === GATEWAY_PAYMENT_STATUS.SUCCESS) {
          Logger.apiInfo('[Payment] IPN already processed (idempotency)', {
            orderId: ipnResult.orderId,
            paymentId: payment._id.toString(),
          })
          return
        }

        // Validate amount matches order amount
        const order = await OrderModel.findById(ipnResult.orderId).session(session).lean()
        if (!order) {
          Logger.apiWarn('[Payment] IPN: order not found', { orderId: ipnResult.orderId })
          return
        }

        if (Math.abs(ipnResult.amount - order.total) > 1) {
          Logger.apiWarn('[Payment] IPN amount mismatch — possible tampering', {
            orderId: ipnResult.orderId,
            ipnAmount: ipnResult.amount,
            orderTotal: order.total,
          })
          await this.paymentRepository.updateById(payment._id, {
            status: GATEWAY_PAYMENT_STATUS.FAILED,
            ipnPayload: ipnResult.rawData,
          })
          incrementFailed()
          return
        }

        const newPaymentStatus = ipnResult.success
          ? GATEWAY_PAYMENT_STATUS.SUCCESS
          : GATEWAY_PAYMENT_STATUS.FAILED

        const newOrderStatus = ipnResult.success
          ? ORDER_STATUS.CONFIRMED
          : ORDER_STATUS.PAYMENT_FAILED

        // Track payment outcome metrics
        if (ipnResult.success) {
          incrementSuccess()
        } else {
          incrementFailed()
        }

        // Update payment record
        await this.paymentRepository.updateById(payment._id, {
          status: newPaymentStatus,
          transactionId: ipnResult.transactionId,
          ipnPayload: ipnResult.rawData,
        })

        // Update order status
        const orderUpdate: Record<string, unknown> = {
          status: newOrderStatus,
          payment_status: ipnResult.success ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
        }
        if (ipnResult.success) {
          orderUpdate.confirmed_at = new Date()
        }

        await OrderModel.findByIdAndUpdate(ipnResult.orderId, orderUpdate).session(session)

        // Emit real-time update to order owner
        emitToUser(order.user.toString(), SocketEvent.PAYMENT_STATUS_UPDATED, {
          orderId: ipnResult.orderId,
          payment_status: ipnResult.success ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED,
          order_status: newOrderStatus,
        })

        Logger.apiInfo('[Payment] IPN processed', {
          orderId: ipnResult.orderId,
          provider,
          success: ipnResult.success,
          newOrderStatus,
        })
      })
    } finally {
      await session.endSession()
    }
  }

  /**
   * Get current payment status for an order.
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: string
    paymentUrl: string | null
    canRetry: boolean
    provider: string | null
  }> {
    const payment = await this.paymentRepository.findLatestByOrderId(orderId)
    const order = await OrderModel.findById(orderId).select('payment_url status').lean()

    if (!payment) {
      return { status: 'NONE', paymentUrl: null, canRetry: false, provider: null }
    }

    const canRetry =
      payment.status === GATEWAY_PAYMENT_STATUS.FAILED ||
      (payment.status === GATEWAY_PAYMENT_STATUS.PENDING &&
        order?.status === ORDER_STATUS.PAYMENT_FAILED)

    return {
      status: payment.status,
      paymentUrl: order?.payment_url || null,
      canRetry,
      provider: payment.provider,
    }
  }

  /**
   * Retry payment for an order with a failed or expired previous attempt.
   */
  async retryPayment(
    orderId: string,
    clientIp: string,
  ): Promise<{ paymentUrl: string; paymentId: string }> {
    const payment = await this.paymentRepository.findLatestByOrderId(orderId)

    if (!payment) {
      throw new Error(`No payment found for order: ${orderId}`)
    }

    if (payment.status === GATEWAY_PAYMENT_STATUS.SUCCESS) {
      throw new Error('Payment already succeeded — cannot retry')
    }

    const provider = payment.provider as PaymentProvider
    return this.initiatePayment(orderId, provider, clientIp)
  }
}
