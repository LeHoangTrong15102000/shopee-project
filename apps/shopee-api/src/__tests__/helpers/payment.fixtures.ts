/**
 * Payment Test Fixtures
 * Factory functions for MoMo/VNPay IPN payloads and Payment records used in tests.
 */
import crypto from 'crypto'
import mongoose from 'mongoose'
import { GATEWAY_PAYMENT_STATUS, PAYMENT_PROVIDER } from '@database/models/payment.model'

// ─── HMAC-SHA256 helper (mirrors momo.provider.ts) ────────────────────────────

export function signMomoPayload(payload: Record<string, unknown>, secretKey: string): string {
  const rawSignature = [
    `accessKey=${payload.accessKey}`,
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

  return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')
}

// ─── MoMo IPN payload factory ─────────────────────────────────────────────────

export interface MomoIpnPayload {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  resultCode: number
  transId: number
  message: string
  orderInfo: string
  orderType: string
  accessKey: string
  payType: string
  responseTime: number
  extraData: string
  signature: string
}

export const createMomoIpnPayload = (overrides?: Partial<MomoIpnPayload>): MomoIpnPayload => {
  const secretKey = process.env.MOMO_SECRET_KEY || ''
  const accessKey = process.env.MOMO_ACCESS_KEY || ''
  const partnerCode = process.env.MOMO_PARTNER_CODE || ''

  const base: Omit<MomoIpnPayload, 'signature'> = {
    partnerCode,
    orderId: 'ORDER_123',
    requestId: 'uuid-v4-request',
    amount: 100000,
    resultCode: 0,
    transId: 3456789012,
    message: 'Successful.',
    orderInfo: 'Test order',
    orderType: 'momo_wallet',
    accessKey,
    payType: 'qr',
    responseTime: 1700000000000,
    extraData: '',
    ...overrides,
  }

  const signature = signMomoPayload(base as Record<string, unknown>, secretKey)

  return { ...base, signature }
}

// ─── VNPay IPN query factory ──────────────────────────────────────────────────

export interface VnpayIpnQuery {
  vnp_TmnCode: string
  vnp_Amount: string
  vnp_TxnRef: string
  vnp_ResponseCode: string
  vnp_TransactionNo: string
  vnp_SecureHash: string
  [key: string]: string
}

export const createVnpayIpnQuery = (overrides?: Partial<VnpayIpnQuery>): VnpayIpnQuery => {
  return {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'TEST_TMN',
    vnp_Amount: '10000000', // 100,000 VND × 100
    vnp_TxnRef: 'ORDER_123',
    vnp_ResponseCode: '00',
    vnp_TransactionNo: '12345678',
    vnp_SecureHash: 'valid_hash_placeholder',
    ...overrides,
  }
}

// ─── Payment record factory ───────────────────────────────────────────────────

export interface PaymentRecordData {
  _id?: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  provider: string
  amount: number
  currency: string
  status: string
  idempotencyKey: string
  transactionId?: string
  createdAt?: Date
}

export const createPaymentRecord = (overrides?: Partial<PaymentRecordData>): PaymentRecordData => {
  return {
    _id: new mongoose.Types.ObjectId(),
    orderId: new mongoose.Types.ObjectId(),
    provider: PAYMENT_PROVIDER.MOMO,
    amount: 100000,
    currency: 'VND',
    status: GATEWAY_PAYMENT_STATUS.PENDING,
    idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date(),
    ...overrides,
  }
}
