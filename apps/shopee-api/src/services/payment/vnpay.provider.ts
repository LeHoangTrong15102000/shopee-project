import { VNPay, HashAlgorithm } from 'vnpay'
import {
  IPaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  IpnResult,
  QueryStatusParams,
  PaymentStatus,
  RefundParams,
  RefundResult,
} from './payment.interface'
import { Logger } from '@utils/logger'

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || ''
const VNPAY_SECURE_SECRET = process.env.VNPAY_SECURE_SECRET || ''
const VNPAY_HOST = process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn'

/**
 * Format a Date as yyyyMMddHHmmss in GMT+7 (Indochina Time), as required by VNPay.
 */
function toVnpayDateString(date: Date): string {
  // Offset to GMT+7: UTC + 7 hours
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const yyyy = gmt7.getUTCFullYear()
  const MM = String(gmt7.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(gmt7.getUTCDate()).padStart(2, '0')
  const HH = String(gmt7.getUTCHours()).padStart(2, '0')
  const mm = String(gmt7.getUTCMinutes()).padStart(2, '0')
  const ss = String(gmt7.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`
}

export class VnpayProvider implements IPaymentProvider {
  private readonly vnpay: VNPay

  constructor() {
    this.vnpay = new VNPay({
      tmnCode: VNPAY_TMN_CODE,
      secureSecret: VNPAY_SECURE_SECRET,
      vnpayHost: VNPAY_HOST,
      testMode: process.env.NODE_ENV !== 'production',
      hashAlgorithm: HashAlgorithm.SHA512,
    })
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const { orderId, amount, orderInfo, returnUrl, clientIp, requestId } = params

    Logger.apiInfo('[VNPay] Creating payment', { orderId, amount, requestId })

    // vnpay library handles amount ×100 automatically
    const paymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: clientIp,
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: requestId, // unique transaction ref (max 34 chars)
      vnp_OrderInfo: orderInfo.substring(0, 255),
    })

    Logger.apiInfo('[VNPay] Payment URL built', { orderId, requestId })

    return {
      paymentUrl,
      requestId,
      transactionId: requestId,
    }
  }

  verifyIpn(payload: Record<string, unknown>): boolean {
    try {
      const result = this.vnpay.verifyIpnCall(payload as any)
      const isValid = result.isVerified

      if (!isValid) {
        Logger.apiWarn('[VNPay] IPN signature verification failed', {
          vnp_TxnRef: payload.vnp_TxnRef,
          vnp_ResponseCode: payload.vnp_ResponseCode,
        })
      }

      return isValid
    } catch (err) {
      Logger.apiError('[VNPay] IPN verification threw error', { error: err })
      return false
    }
  }

  parseIpnResult(payload: Record<string, unknown>): IpnResult {
    const responseCode = String(payload.vnp_ResponseCode)
    // VNPay returns amount ×100 — divide to get actual VND amount
    const amount = Number(payload.vnp_Amount) / 100

    return {
      orderId: String(payload.vnp_TxnRef),
      transactionId: String(payload.vnp_TransactionNo || payload.vnp_TxnRef),
      amount,
      success: responseCode === '00',
      resultCode: responseCode,
      message:
        responseCode === '00' ? 'Giao dịch thành công' : `Giao dịch thất bại (${responseCode})`,
      rawData: payload,
    }
  }

  async queryStatus(params: QueryStatusParams): Promise<PaymentStatus> {
    const { orderId, requestId, transactionId } = params

    Logger.apiInfo('[VNPay] Querying transaction status', { orderId, requestId })

    try {
      const now = new Date()
      const result = await this.vnpay.queryDr({
        vnp_RequestId: requestId,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Query transaction ${orderId}`,
        vnp_TransactionDate: toVnpayDateString(now) as any,
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: toVnpayDateString(now) as any,
        // vnp_TransactionNo is required by the type; use parsed int from transactionId or 0
        vnp_TransactionNo: transactionId ? parseInt(transactionId, 10) || 0 : 0,
      })

      const responseCode = String(result.vnp_ResponseCode)
      if (responseCode === '00') return PaymentStatus.SUCCESS
      return PaymentStatus.FAILED
    } catch (err) {
      Logger.apiError('[VNPay] Query status failed', { orderId, error: err })
      return PaymentStatus.PENDING
    }
  }

  /**
   * VNPay programmatic refund is not available by default.
   * Merchants must contact VNPay to activate the refund API.
   * Returns an unsupported result so the caller falls back to manual processing.
   */
  async refund(_params: RefundParams): Promise<RefundResult> {
    return {
      success: false,
      resultCode: 'UNSUPPORTED',
      message:
        'VNPay programmatic refund requires merchant activation. Process manually via VNPay portal.',
    }
  }

  async queryRefundStatus(_params: { orderId: string; requestId: string }): Promise<RefundResult> {
    return {
      success: false,
      resultCode: 'UNSUPPORTED',
      message: 'VNPay refund status query is not supported.',
    }
  }
}
