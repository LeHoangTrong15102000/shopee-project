import crypto from 'crypto'
import axios from 'axios'
import {
  IPaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  IpnResult,
  QueryStatusParams,
  PaymentStatus,
} from './payment.interface'
import { Logger } from '@utils/logger'

const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn'
const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || ''
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY || ''
const SECRET_KEY = process.env.MOMO_SECRET_KEY || ''

function hmacSha256(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

export class MomoProvider implements IPaymentProvider {
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const {
      orderId,
      amount,
      orderInfo,
      returnUrl,
      ipnUrl,
      requestId,
    } = params

    const extraData = ''
    const requestType = 'captureWallet'

    // Signature string — fields in exact order per MoMo docs
    const rawSignature = [
      `accessKey=${ACCESS_KEY}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${PARTNER_CODE}`,
      `redirectUrl=${returnUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, SECRET_KEY)

    const requestBody = {
      partnerCode: PARTNER_CODE,
      accessKey: ACCESS_KEY,
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

    const response = await axios.post(
      `${MOMO_ENDPOINT}/v2/gateway/api/create`,
      requestBody,
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      },
    )

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
      `accessKey=${ACCESS_KEY}`,
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

    const computed = hmacSha256(rawSignature, SECRET_KEY)
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
      `accessKey=${ACCESS_KEY}`,
      `orderId=${orderId}`,
      `partnerCode=${PARTNER_CODE}`,
      `requestId=${requestId}`,
    ].join('&')

    const signature = hmacSha256(rawSignature, SECRET_KEY)

    const requestBody = {
      partnerCode: PARTNER_CODE,
      accessKey: ACCESS_KEY,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    }

    Logger.apiInfo('[MoMo] Querying transaction status', { orderId, requestId })

    const response = await axios.post(
      `${MOMO_ENDPOINT}/v2/gateway/api/query`,
      requestBody,
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      },
    )

    const data = response.data
    const resultCode = Number(data.resultCode)

    if (resultCode === 0) return PaymentStatus.SUCCESS
    if (resultCode === 1000 || resultCode === 7000) return PaymentStatus.PENDING
    return PaymentStatus.FAILED
  }
}
