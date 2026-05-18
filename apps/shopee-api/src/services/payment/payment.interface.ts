// Payment gateway provider interface and shared types

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
  COD = 'COD',
}

export interface CreatePaymentParams {
  orderId: string
  amount: number // VND, integer
  orderInfo: string
  returnUrl: string
  ipnUrl: string
  clientIp: string
  requestId: string // UUID v4
}

export interface PaymentResult {
  paymentUrl: string
  transactionId?: string
  requestId: string
  expireAt?: Date
}

export interface IpnResult {
  orderId: string
  transactionId: string
  amount: number
  success: boolean
  resultCode: number | string
  message: string
  rawData: Record<string, unknown>
}

export interface QueryStatusParams {
  orderId: string
  requestId: string
  transactionId?: string
}

export interface RefundParams {
  transactionId: string | number // MoMo transId or provider transaction ID
  amount: number // VND integer
  orderId: string // unique refund order ID for this refund request
  requestId: string // idempotency key
  description?: string
}

export interface RefundResult {
  success: boolean
  transactionId?: string // provider's refund transaction ID
  resultCode: number | string
  message: string
}

export interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  verifyIpn(payload: Record<string, unknown>): boolean
  parseIpnResult(payload: Record<string, unknown>): IpnResult
  queryStatus(params: QueryStatusParams): Promise<PaymentStatus>
  refund?(params: RefundParams): Promise<RefundResult>
  queryRefundStatus?(params: { orderId: string; requestId: string }): Promise<RefundResult>
}
