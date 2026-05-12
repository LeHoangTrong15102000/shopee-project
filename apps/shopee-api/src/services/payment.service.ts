import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import { PaymentRepository } from '@repositories/payment.repository'
import { OrderModel, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@database/models/order.model'
import { GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { IPaymentProvider, PaymentProvider, PaymentStatus } from './payment/payment.interface'
import { MomoProvider } from './payment/momo.provider'
import { VnpayProvider } from './payment/vnpay.provider'
import { emitToUser } from '../socket/utils/emit'
import { SocketEvent } from '../@types/socket.type'
import { Logger } from '@utils/logger'

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
   * Initiate a payment for an order.
   * Idempotent: if a PENDING payment already exists for this order, returns it.
   */
  async initiatePayment(
    orderId: string,
    provider: PaymentProvider,
    clientIp: string,
  ): Promise<{ paymentUrl: string; paymentId: string }> {
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
   * Uses Mongoose transaction to prevent race conditions on duplicate IPN delivery.
   */
  async handleIpn(
    provider: PaymentProvider,
    payload: Record<string, unknown>,
  ): Promise<void> {
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
          return
        }

        const newPaymentStatus = ipnResult.success
          ? GATEWAY_PAYMENT_STATUS.SUCCESS
          : GATEWAY_PAYMENT_STATUS.FAILED

        const newOrderStatus = ipnResult.success
          ? ORDER_STATUS.CONFIRMED
          : ORDER_STATUS.PAYMENT_FAILED

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
