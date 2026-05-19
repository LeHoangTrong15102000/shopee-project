import crypto from 'crypto'
import axios from 'axios'
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

const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn'

function hmacSha256(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

export class MomoProvider implements IPaymentProvider {
  private _partnerCode: string | null = null
  private _accessKey: string | null = null
  private _secretKey: string | null = null

  private get partnerCode(): string {
    if (this._partnerCode === null) {
      this._partnerCode = process.env.MOMO_PARTNER_CODE ?? ''
      if (!this._partnerCode) {
        throw new Error('MomoProvider: MOMO_PARTNER_CODE environment variable is required but not set')
      }
    }
    return this._partnerCode
  }

  private get accessKey(): string {
    if (this._accessKey === null) {
      this._accessKey = process.env.MOMO_ACCESS_KEY ?? ''
      if (!this._accessKey) {
        throw new Error('MomoProvider: MOMO_ACCESS_KEY environment variable is required but not set')
      }
    }
    return this._accessKey
  }

  private get secretKey(): string {
    if (this._secretKey === null) {
      this._secretKey = process.env.MOMO_SECRET_KEY ?? ''
      if (!this._secretKey) {
        throw new Error('MomoProvider: MOMO_SECRET_KEY environment variable is required but not set')
      }
    }
    return this._secretKey
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const { orderId, amount, orderInfo, returnUrl, ipnUrl, requestId } = params

    const extraData = ''
    const requestType = 'captureWallet'

    // Signature string — fields in exact order per MoMo docs
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${returnUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, this.secretKey)

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    }

    Logger.apiInfo('[MoMo] Creating payment', { orderId, amount, requestId })

    const response = await axios.post(`${MOMO_ENDPOINT}/v2/gateway/api/create`, requestBody, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    const data = response.data

    if (data.resultCode !== 0) {
      Logger.apiWarn('[MoMo] Payment creation failed', {
        orderId,
        resultCode: data.resultCode,
        message: data.message,
      })
      throw new Error(`MoMo payment creation failed: [${data.resultCode}] ${data.message}`)
    }

    Logger.apiInfo('[MoMo] Payment created successfully', {
      orderId,
      requestId,
      resultCode: data.resultCode,
    })

    return {
      paymentUrl: data.payUrl,
      requestId,
      transactionId: data.orderId,
    }
  }

  verifyIpn(payload: Record<string, unknown>): boolean {
    // IPN signature string — fields alphabetically sorted per MoMo docs
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${payload.amount}`,
      `extraData=${payload.extraData}`,
      `message=${payload.message}`,
      `orderId=${payload.orderId}`,
      `orderInfo=${payload.orderInfo}`,
      `orderType=${payload.orderType}`,
      `partnerCode=${payload.partnerCode}`,
      `payType=${payload.payType}`,
      `requestId=${payload.requestId}`,
      `responseTime=${payload.responseTime}`,
      `resultCode=${payload.resultCode}`,
      `transId=${payload.transId}`,
    ].join('&')

    const computed = hmacSha256(rawSignature, this.secretKey)
    const isValid = computed === payload.signature

    if (!isValid) {
      Logger.apiWarn('[MoMo] IPN signature verification failed', {
        orderId: payload.orderId,
        computed,
        received: payload.signature,
      })
    }

    return isValid
  }

  parseIpnResult(payload: Record<string, unknown>): IpnResult {
    const resultCode = Number(payload.resultCode)
    return {
      orderId: String(payload.orderId),
      transactionId: String(payload.transId),
      amount: Number(payload.amount),
      success: resultCode === 0,
      resultCode,
      message: String(payload.message),
      rawData: payload,
    }
  }

  async queryStatus(params: QueryStatusParams): Promise<PaymentStatus> {
    const { orderId, requestId } = params

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `orderId=${orderId}`,
      `partnerCode=${this.partnerCode}`,
      `requestId=${requestId}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, this.secretKey)

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    }

    Logger.apiInfo('[MoMo] Querying transaction status', { orderId, requestId })

    const response = await axios.post(`${MOMO_ENDPOINT}/v2/gateway/api/query`, requestBody, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    const data = response.data
    const resultCode = Number(data.resultCode)

    if (resultCode === 0) return PaymentStatus.SUCCESS
    if (resultCode === 1000 || resultCode === 7000) return PaymentStatus.PENDING
    return PaymentStatus.FAILED
  }

  /**
   * Request a refund from MoMo.
   * POST /v2/gateway/api/refund
   * Signature = HMAC-SHA256 of:
   *   accessKey=...&amount=...&description=...&orderId=...&partnerCode=...&requestId=...&transId=...
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const { transactionId, amount, orderId, requestId, description = '' } = params

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `description=${description}`,
      `orderId=${orderId}`,
      `partnerCode=${this.partnerCode}`,
      `requestId=${requestId}`,
      `transId=${transactionId}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, this.secretKey)

    const requestBody = {
      partnerCode: this.partnerCode,
      orderId,
      requestId,
      amount,
      transId: transactionId,
      lang: 'vi',
      description,
      signature,
    }

    Logger.apiInfo('[MoMo] Requesting refund', { orderId, amount, requestId })

    try {
      const response = await axios.post(`${MOMO_ENDPOINT}/v2/gateway/api/refund`, requestBody, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      })

      const data = response.data
      const resultCode = Number(data.resultCode)
      const success = resultCode === 0

      if (!success) {
        Logger.apiWarn('[MoMo] Refund request failed', {
          orderId,
          resultCode,
          message: data.message,
        })
      } else {
        Logger.apiInfo('[MoMo] Refund request succeeded', {
          orderId,
          transId: data.transId,
        })
      }

      return {
        success,
        transactionId: data.transId ? String(data.transId) : undefined,
        resultCode,
        message: String(data.message || ''),
      }
    } catch (err: any) {
      Logger.apiError('[MoMo] Refund request threw error', { orderId, error: err?.message })
      return {
        success: false,
        resultCode: -1,
        message: err?.message || 'MoMo refund request failed',
      }
    }
  }

  /**
   * Query the status of a previously submitted refund.
   * POST /v2/gateway/api/refund/query
   */
  async queryRefundStatus(params: { orderId: string; requestId: string }): Promise<RefundResult> {
    const { orderId, requestId } = params

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `orderId=${orderId}`,
      `partnerCode=${this.partnerCode}`,
      `requestId=${requestId}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, this.secretKey)

    const requestBody = {
      partnerCode: this.partnerCode,
      orderId,
      requestId,
      signature,
      lang: 'vi',
    }

    Logger.apiInfo('[MoMo] Querying refund status', { orderId, requestId })

    try {
      const response = await axios.post(
        `${MOMO_ENDPOINT}/v2/gateway/api/refund/query`,
        requestBody,
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
        },
      )

      const data = response.data
      const resultCode = Number(data.resultCode)
      // MoMo resultCode 0 = success, 1000/7000 = pending, others = failed
      const success = resultCode === 0
      const isPending = resultCode === 1000 || resultCode === 7000

      return {
        success,
        transactionId: data.transId ? String(data.transId) : undefined,
        resultCode: isPending ? 'PENDING' : resultCode,
        message: String(data.message || ''),
      }
    } catch (err: any) {
      Logger.apiError('[MoMo] Refund status query threw error', { orderId, error: err?.message })
      return {
        success: false,
        resultCode: 'PENDING', // treat errors as pending — will retry next poll
        message: err?.message || 'MoMo refund status query failed',
      }
    }
  }
}
