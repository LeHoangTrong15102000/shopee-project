# PAYMENT GATEWAY ARCHITECTURE ANALYSIS

> **Tài liệu phân tích chi tiết kiến trúc Payment Gateway trong shopee-project và so sánh với mô hình Shopee/Grab Enterprise**
>
> **Ngày tạo:** 17/05/2026
> **Phiên bản:** 1.0

---

## MỤC LỤC

1. [Tổng quan kiến trúc Payment Gateway hiện tại](#1-tong-quan)
2. [Chi tiết từng Provider Integration](#2-chi-tiet-provider)
3. [Các Design Patterns đang áp dụng](#3-design-patterns)
4. [So sánh với kiến trúc Shopee/Grab trong thực tế](#4-so-sanh-enterprise)
5. [Bảng so sánh chi tiết: Hệ thống hiện tại vs Enterprise](#5-bang-so-sanh)
6. [Đánh giá Gap Analysis](#6-gap-analysis)
7. [Roadmap đề xuất (5 layers)](#7-roadmap)
8. [Kết luận](#8-ket-luan)

---

## 1. Tổng quan kiến trúc Payment Gateway hiện tại

### 1.1 Kiến trúc tổng thể

Hệ thống payment trong shopee-project được xây dựng theo mô hình **multi-provider gateway** với Strategy Pattern làm nền tảng. Thay vì hard-code logic cho từng provider, toàn bộ interaction được chuẩn hóa qua một interface duy nhất.

Có ba provider chính:

- **Stripe** — thẻ tín dụng quốc tế, PaymentIntent-based, client-side confirmation
- **MoMo** — ví điện tử Việt Nam, redirect-based, direct HTTP integration
- **VNPay** — cổng thanh toán Việt Nam, URL-based, community package wrapper (vnpay v2.5.0)

```
+---------------------------------------------------------------------+
|                         shopee-api                                  |
|                                                                     |
|  +--------------+    +------------------------------------------+  |
|  |   Frontend   |    |           PaymentService                 |  |
|  |  (shopee-web)|    |  (Orchestrator / Business Logic)         |  |
|  +------+-------+    +------------------+-----------------------+  |
|         |                               |                           |
|         | REST API                      | getProvider(method)       |
|         |                               |                           |
|  +------v-------+    +------------------v-----------------------+  |
|  |  Controllers |    |         IPaymentProvider (interface)      |  |
|  |  - payment   |    |  + createPayment(params): PaymentResult   |  |
|  |  - ipn       |    |  + verifyIpn(payload): boolean            |  |
|  |  - checkout  |    |  + parseIpnResult(payload): IpnResult     |  |
|  +--------------+    |  + queryStatus(params): PaymentStatus     |  |
|                      +----------+--------------+-----------------+  |
|                                 |              |                     |
|                    +------------v--+  +--------v----------+        |
|                    | MomoProvider  |  |  VnpayProvider    |        |
|                    | (HMAC-SHA256) |  |  (vnpay v2.5.0)   |        |
|                    +---------------+  +-------------------+        |
|                                                                     |
|  +--------------------------------------------------------------+  |
|  |                    Stripe (separate path)                     |  |
|  |  StripeService -> PaymentIntent -> Webhook -> PaymentLog      |  |
|  +--------------------------------------------------------------+  |
|                                                                     |
|  +--------------------------------------------------------------+  |
|  |                    Data Layer                                 |  |
|  |  PaymentRepository  PaymentModel  PaymentSessionModel        |  |
|  |  PaymentLogModel    OrderModel                               |  |
|  +--------------------------------------------------------------+  |
+---------------------------------------------------------------------+
```

### 1.2 IPaymentProvider Interface — Trái tim của Strategy Pattern

File: `apps/shopee-api/src/services/payment/payment.interface.ts`

```typescript
export interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  verifyIpn(payload: Record<string, unknown>): boolean
  parseIpnResult(payload: Record<string, unknown>): IpnResult
  queryStatus(params: QueryStatusParams): Promise<PaymentStatus>
}
```

Interface này định nghĩa **4 operations** mà mọi provider đều phải implement:

| Operation        | Mục đích                                                      |
| ---------------- | ------------------------------------------------------------- |
| `createPayment`  | Tạo payment URL / transaction tại provider                    |
| `verifyIpn`      | Xác minh chữ ký HMAC của IPN callback                         |
| `parseIpnResult` | Chuẩn hóa IPN payload thành `IpnResult`                       |
| `queryStatus`    | Chủ động query trạng thái giao dịch (dùng cho reconciliation) |

### 1.3 PaymentService — Orchestrator

`PaymentService` là lớp điều phối trung tâm, chịu trách nhiệm:

- **Factory**: `getProvider(method)` trả về đúng provider instance
- **Session Management**: Tạo và quản lý `PaymentSession` cho e-wallet flows
- **IPN Routing**: Phân biệt session-based vs order-based IPN qua prefix `session_`
- **Idempotency**: Kiểm tra trạng thái trước khi xử lý để tránh duplicate
- **Metrics**: Gọi `incrementInitiated/Success/Failed` cho monitoring

```typescript
// Factory Pattern — getProvider() trong PaymentService
getProvider(method: PaymentProvider): IPaymentProvider {
  switch (method) {
    case PaymentProvider.MOMO:  return this.momoProvider
    case PaymentProvider.VNPAY: return this.vnpayProvider
    default: throw new Error(`Unsupported payment provider: ${method}`)
  }
}
```

### 1.4 PaymentSession Model — Pre-order Payment Flow

Một điểm thiết kế quan trọng: với e-wallet (MoMo/VNPay), **order KHÔNG được tạo trước khi thanh toán thành công**. Thay vào đó:

1. Frontend gọi `createPaymentSession` → tạo `PaymentSession` với toàn bộ cart data
2. User được redirect đến trang thanh toán của provider
3. Provider gọi IPN callback → `handleSessionIpn` → tạo Order từ session

```
User                  Frontend              Backend               Provider
 |                       |                     |                     |
 |  1. Checkout          |                     |                     |
 |---------------------->|                     |                     |
 |                       |  2. createSession   |                     |
 |                       |-------------------->|                     |
 |                       |                     |  3. createPayment   |
 |                       |                     |-------------------->|
 |                       |                     |  4. paymentUrl      |
 |                       |                     |<--------------------|
 |                       |  5. {sessionId,     |                     |
 |                       |     payment_url}    |                     |
 |                       |<--------------------|                     |
 |  6. Redirect to       |                     |                     |
 |     payment page      |                     |                     |
 |<----------------------|                     |                     |
 |                       |                     |                     |
 |  7. User pays at provider                                         |
 |------------------------------------------------------------------>|
 |                       |                     |  8. IPN callback    |
 |                       |                     |<--------------------|
 |                       |                     |  9. Mongoose txn:   |
 |                       |                     |     verify sig      |
 |                       |                     |     check idempotency
 |                       |                     |     validate amount |
 |                       |                     |     mark PAID       |
 |                       |                     |  10. setImmediate:  |
 |                       |                     |      createOrder    |
 |                       |                     |      FromSession    |
 |  11. Poll /session-status                   |                     |
 |---------------------->|                     |                     |
 |                       |  12. GET status     |                     |
 |                       |-------------------->|                     |
 |                       |  13. {PAID, orderId}|                     |
 |                       |<--------------------|                     |
 |  14. Redirect to      |                     |                     |
 |     order detail      |                     |                     |
 |<----------------------|                     |                     |
```

PaymentSession co TTL index — MongoDB tu dong xoa sau khi `expiresAt` (mac dinh 15 phut):

```typescript
// payment-session.model.ts
PaymentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### 1.5 PaymentRepository Pattern

`PaymentRepository` cung cap data access layer voi cac query methods chuyen biet:

```typescript
findPendingByOrderId(orderId) // Idempotency check khi initiate payment
findBySessionId(sessionId) // Session-based IPN lookup
findByIdempotencyKey(key) // Duplicate detection
findLatestByOrderId(orderId) // Lay payment moi nhat cho order
findWithFilters(filters) // Admin dashboard pagination
```

---

## 2. Chi tiết từng Provider Integration

### 2.1 Stripe — PaymentIntent-based Flow

Stripe sử dụng kiến trúc **client-side confirmation** — khác hoàn toàn với MoMo/VNPay redirect-based.

#### Flow chi tiết

```
Frontend                    Backend                    Stripe
   |                           |                          |
   |  1. POST /orders          |                          |
   |-------------------------->|                          |
   |                           |  2. stripe.paymentIntents|
   |                           |     .create({amount,     |
   |                           |      metadata:{orderId}})|
   |                           |------------------------->|
   |                           |  3. {id, client_secret}  |
   |                           |<-------------------------|
   |  4. {client_secret}       |                          |
   |<--------------------------|                          |
   |                           |                          |
   |  5. stripe.confirmCardPayment(client_secret, card)   |
   |----------------------------------------------------->|
   |  6. (3DS popup neu can)   |                          |
   |<--------------------------------------------------->|
   |  7. {status: succeeded}   |                          |
   |<-----------------------------------------------------|
   |                           |                          |
   |                           |  8. Webhook POST         |
   |                           |     payment_intent       |
   |                           |     .succeeded           |
   |                           |<-------------------------|
   |                           |  9. Verify signature     |
   |                           |     (express.raw())      |
   |                           |  10. Update order        |
   |                           |      status = confirmed  |
   |                           |  11. Emit WebSocket      |
   |                           |      PAYMENT_STATUS_     |
   |                           |      UPDATED             |
   |  12. Real-time update     |                          |
   |<--------------------------|                          |
```

#### Webhook Handling — express.raw() requirement

Stripe yêu cầu raw Buffer để verify HMAC signature. Route phải được đăng ký với `express.raw()` **trước** `express.json()`:

```typescript
// payment.controller.ts — stripeWebhook handler
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string

  // CRITICAL: req.body phai la raw Buffer — khong phai parsed JSON
  let event
  try {
    event = stripeService.constructWebhookEvent(req.body as Buffer, signature)
  } catch (err: any) {
    res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` })
    return
  }

  // Idempotency check — skip neu da xu ly event nay
  const alreadyProcessed = await PaymentLogModel.exists({ stripe_event_id: event.id })
  if (alreadyProcessed) {
    res.status(200).json({ received: true })
    return
  }
  // ...
}
```

#### PaymentLog Model — Idempotency cho Stripe

```typescript
// payment-log.model.ts
export interface IPaymentLog {
  order_id: mongoose.Types.ObjectId
  stripe_event_id: string // unique index — idempotency key
  stripe_event_type: string // 'payment_intent.succeeded' | 'payment_intent.payment_failed'
  stripe_payment_intent_id: string
  status: string
  raw_data: Record<string, unknown> // full Stripe event — audit trail
}
```

Mỗi Stripe webhook event được lưu với `stripe_event_id` là unique index. Nếu Stripe retry cùng event, `PaymentLogModel.exists()` sẽ phát hiện và skip.

#### Real-time WebSocket Notification

Sau khi xử lý webhook thành công, backend emit event đến user qua Socket.IO:

```typescript
emitToUser(updatedOrder.user.toString(), SocketEvent.PAYMENT_STATUS_UPDATED, {
  orderId: updatedOrder._id.toString(),
  payment_status: paymentStatus,
  order_status: orderStatus || updatedOrder.status,
})
```

---

### 2.2 MoMo — Direct HTTP Integration

MoMo sử dụng **direct HTTP integration** với axios, không có SDK chính thức.

#### Signature Generation — HMAC-SHA256

```typescript
// momo.provider.ts — createPayment
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
].join('&') // Thu tu fields la bat buoc theo MoMo docs

const signature = hmacSha256(rawSignature, SECRET_KEY)
```

Điểm quan trọng: **thứ tự các fields trong rawSignature là bắt buộc** — MoMo sẽ reject nếu sai thứ tự. Đây là lỗi phổ biến nhất khi integrate MoMo.

#### IPN Flow — HTTP 204 Response

```
MoMo Server              shopee-api
     |                       |
     |  POST /payment/momo/ipn
     |  {orderId, resultCode, |
     |   transId, signature}  |
     |---------------------->|
     |                       |  1. Rate limit check (100 req/min)
     |                       |  2. IP whitelist check (production only)
     |                       |  3. Verify HMAC-SHA256 signature
     |                       |  4. Parse IPN result
     |                       |  5. Mongoose transaction:
     |                       |     - Check idempotency (session status)
     |                       |     - Validate amount (+-1 VND tolerance)
     |                       |     - Update PaymentSession to PAID/FAILED
     |                       |     - setImmediate: createOrderFromSession
     |  HTTP 204 (No Content) |
     |<----------------------|
```

MoMo yêu cầu **HTTP 204** (không có body) trong vòng 15 giây. Nếu không nhận được 204, MoMo sẽ retry. Đây là lý do tại sao `createOrderFromSession` được gọi qua `setImmediate` — để trả về 204 ngay lập tức mà không chờ order creation.

#### IP Whitelist Middleware (Production)

```typescript
// momoIpWhitelist.middleware.ts
const DEFAULT_WHITELIST = ['118.69.210.244', '116.103.110.134'] // MoMo production IPs

export function momoIpWhitelist(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production') return next() // Skip in dev/test

  const clientIp = extractClientIp(req) // Handles X-Forwarded-For
  if (clientIp && whitelist.includes(clientIp)) return next()

  res.status(403).json({ success: false, message: 'Forbidden: IP not whitelisted' })
}
```

#### Rate Limiting

IPN endpoint được bảo vệ bởi rate limiter (100 req/min per IP), sử dụng Redis khi available, fallback về in-memory:

```typescript
// ipn.route.ts
const ipnLimiter = redisClient
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:ipn',
      points: 100,
      duration: 60,
      insuranceLimiter: new RateLimiterMemory({ points: 100, duration: 60 }),
    })
  : new RateLimiterMemory({ keyPrefix: 'rl:ipn', points: 100, duration: 60 })
```

---

### 2.3 VNPay — Community Package Wrapper

VNPay sử dụng package `vnpay` v2.5.0 — một community wrapper xử lý URL building và signature verification.

#### Khởi tạo VNPay instance

```typescript
// vnpay.provider.ts
this.vnpay = new VNPay({
  tmnCode: VNPAY_TMN_CODE,
  secureSecret: VNPAY_SECURE_SECRET,
  vnpayHost: VNPAY_HOST,
  testMode: process.env.NODE_ENV !== 'production',
  hashAlgorithm: HashAlgorithm.SHA512, // VNPay dung HMAC-SHA512
})
```

#### URL-based Flow (không phải REST API)

VNPay không có REST API — toàn bộ payment data được encode vào URL:

```typescript
const paymentUrl = this.vnpay.buildPaymentUrl({
  vnp_Amount: amount, // Library tu nhan x100
  vnp_IpAddr: clientIp,
  vnp_ReturnUrl: returnUrl,
  vnp_TxnRef: requestId, // Unique transaction ref (max 34 chars)
  vnp_OrderInfo: orderInfo.substring(0, 255),
})
// Ket qua: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...&vnp_SecureHash=...
```

#### IPN via GET Query Params

VNPay gửi IPN qua **GET request với query params** (khác MoMo dùng POST JSON):

```typescript
// ipn.controller.ts — vnpayIpn
export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
  // Verify signature TRUOC khi delegate
  const signatureValid = provider.verifyIpn(req.query as Record<string, unknown>)

  if (!signatureValid) {
    res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' })
    return
  }

  await paymentService.handleIpn(PaymentProvider.VNPAY, req.query as Record<string, unknown>)
  res.status(200).json({ RspCode: '00', Message: 'Confirm Success' })
}
```

VNPay yêu cầu response là **JSON với RspCode** (không phải HTTP status code):

- `RspCode: "00"` — xử lý thành công
- `RspCode: "97"` — sai checksum
- `RspCode: "99"` — lỗi không xác định

#### Amount Handling — x100 quirk

```typescript
// vnpay.provider.ts — parseIpnResult
// VNPay tra ve amount x100 — phai chia de lay VND thuc
const amount = Number(payload.vnp_Amount) / 100
```

VNPay encode amount ×100 trong URL. Library `vnpay` tự nhân ×100 khi build URL, nhưng khi parse IPN phải tự chia.

#### GMT+7 Date Formatting

VNPay yêu cầu date format `yyyyMMddHHmmss` theo múi giờ GMT+7:

```typescript
// vnpay.provider.ts
function toVnpayDateString(date: Date): string {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  // Format: yyyyMMddHHmmss
  return `${gmt7.getUTCFullYear()}${MM}${dd}${HH}${mm}${ss}`
}
```

---

### 2.4 Reconciliation Job — Safety Net

Ngoài IPN real-time, hệ thống có `PaymentReconciliationJob` chạy định kỳ (mặc định 24h) để xử lý các payment bị stuck ở PENDING:

```
PaymentReconciliationJob.runOnce()
  |
  +-- Query PENDING payments older than 30 minutes
  |
  +-- For each stale payment:
  |     |
  |     +-- Skip COD (no provider to query)
  |     |
  |     +-- providerInstance.queryStatus(orderId, requestId)
  |     |
  |     +-- SUCCESS -> payment.status = SUCCESS
  |     |             order.status = confirmed
  |     |
  |     +-- FAILED  -> payment.status = FAILED
  |     |             order.status = payment_failed
  |     |
  |     +-- PENDING -> skip (still waiting)
  |
  +-- Log summary: {confirmed, failed, still_pending, total_checked}
```

---

## 3. Các Design Patterns đang áp dụng

### 3.1 Strategy Pattern — IPaymentProvider

Pattern cốt lõi của toàn bộ hệ thống. Mỗi provider implement cùng interface, cho phép swap provider mà không thay đổi business logic:

```
IPaymentProvider (interface)
       |
       +-- MomoProvider   (HMAC-SHA256, axios, POST JSON)
       +-- VnpayProvider  (HMAC-SHA512, vnpay package, URL-based)
       +-- [future]       (ZaloPay, PayOS, ShopeePay...)
```

**Lợi ích**: Thêm provider mới chỉ cần implement 4 methods, không sửa PaymentService.

### 3.2 Repository Pattern — PaymentRepository

Tách biệt data access logic khỏi business logic. PaymentService không gọi Mongoose trực tiếp:

```typescript
// PaymentService chi biet ve PaymentRepository, khong biet ve PaymentModel
constructor(private readonly paymentRepository: PaymentRepository) {}

// PaymentRepository biet ve PaymentModel
async findPendingByOrderId(orderId): Promise<IPayment | null> {
  return PaymentModel.findOne({ orderId, status: 'PENDING' })
    .sort({ createdAt: -1 }).lean()
}
```

### 3.3 Session Pattern — PaymentSession

Pre-order payment flow: lưu cart state vào session trước khi redirect, tạo order sau khi IPN confirm. Giải quyết vấn đề:

- Không tạo order "ghost" khi user abandon payment
- Cart data được preserve trong 15 phút TTL
- Order chỉ được tạo khi payment thực sự thành công

### 3.4 Factory Pattern — getProvider()

```typescript
// PaymentService.getProvider() — Factory Method
getProvider(method: PaymentProvider): IPaymentProvider {
  switch (method) {
    case PaymentProvider.MOMO:  return this.momoProvider
    case PaymentProvider.VNPAY: return this.vnpayProvider
    default: throw new Error(`Unsupported payment provider: ${method}`)
  }
}
```

### 3.5 Idempotency Pattern

Được implement ở nhiều tầng:

| Tầng            | Mechanism                                     | Mục đích                      |
| --------------- | --------------------------------------------- | ----------------------------- |
| Stripe webhook  | `PaymentLogModel.exists({ stripe_event_id })` | Tránh xử lý duplicate webhook |
| MoMo/VNPay IPN  | Check `session.status === PAID`               | Tránh tạo order 2 lần         |
| initiatePayment | `findPendingByOrderId`                        | Tránh tạo 2 payment records   |
| Payment record  | `idempotencyKey` unique index                 | Database-level dedup          |

### 3.6 Observer Pattern — WebSocket Notifications

Sau khi IPN xử lý thành công, backend emit event đến user qua Socket.IO:

```
IPN Handler
    |
    +-- Update DB (payment, order)
    |
    +-- emitToUser(userId, PAYMENT_STATUS_UPDATED, payload)
              |
              +-- Socket.IO room: user:{userId}
              |
              +-- Frontend listener: update UI in real-time
```

### 3.7 Sliding-Window Metrics Pattern

Module `payment-metrics.ts` implement sliding-window failure rate alert:

```typescript
// payment-metrics.ts
const WINDOW_MS = 5 * 60_000 // 5-minute window
const FAILURE_RATE_THRESHOLD = 0.1 // Alert khi > 10% failure rate
const MIN_EVENTS_FOR_ALERT = 5 // Can it nhat 5 events
const ALERT_DEBOUNCE_MS = 60_000 // Debounce 60s de tranh log flooding

// Circular buffer cua timestamped outcome events
const outcomeBuffer: OutcomeEvent[] = []

// Moi lan incrementSuccess/Failed duoc goi:
// 1. Push event vao buffer
// 2. Prune events older than 5 minutes
// 3. Compute failure rate
// 4. Log CRITICAL alert neu rate > 10% va total >= 5
```

---

## 4. So sánh với kiến trúc Shopee/Grab trong thực tế

### 4.1 ShopeePay Architecture

ShopeePay (SPay) là hệ thống payment của Shopee, được thiết kế cho scale hàng triệu giao dịch/ngày.

#### Hosted-checkout Model với Session Lifecycle

```
Merchant App          ShopeePay API          User Browser
     |                     |                       |
     |  POST /checkout/    |                       |
     |  {amount,           |                       |
     |   reference_id,     |                       |
     |   redirect_url}     |                       |
     |-------------------->|                       |
     |                     |  Create session       |
     |                     |  State: Active        |
     |  {checkout_url,     |                       |
     |   session_id}       |                       |
     |<--------------------|                       |
     |                     |                       |
     |  Redirect user to checkout_url             |
     |---------------------------------------------->|
     |                     |                       |
     |                     |  User authenticates   |
     |                     |  & confirms payment   |
     |                     |<----------------------|
     |                     |                       |
     |                     |  State: Successful    |
     |  Webhook callback   |                       |
     |<--------------------|                       |
     |  {session_id,       |                       |
     |   status: SUCCESS,  |                       |
     |   reference_id}     |                       |
```

#### Explicit State Machine

ShopeePay có state machine rõ ràng với các transitions được document:

```
                    +----------+
                    |  Active  |  (session created, awaiting payment)
                    +----+-----+
                         |
           +-------------+-------------+
           |             |             |
    +------v------+ +----v----+ +------v------+
    | Successful  | | Expired | | Cancelled   |
    | (paid)      | | (15min) | | (user abort)|
    +------+------+ +---------+ +-------------+
           |
    +------v------+
    |  Settled    |  (funds transferred to merchant)
    +-------------+
```

#### Bidirectional Signature Verification

ShopeePay dùng HMAC-SHA256 + Base64 encoding, và verify **cả hai chiều** (request và response):

```
Merchant -> ShopeePay: sign request with client_secret
ShopeePay -> Merchant: sign webhook with webhook_secret
Merchant verifies webhook signature before processing
```

#### reference_id based Idempotency

Merchant cung cấp `reference_id` (UUID) cho mỗi checkout request. ShopeePay đảm bảo idempotency — cùng `reference_id` sẽ trả về cùng session.

---

### 4.2 GrabPay Architecture

GrabPay là hệ thống payment của Grab, phục vụ 8 quốc gia Đông Nam Á với hàng trăm triệu giao dịch.

#### Modular Grablet Framework

```
+----------------------------------------------------------+
|                    Grab Super App                        |
|                                                          |
|  +----------+  +----------+  +----------+  +----------+ |
|  | GrabFood | | GrabCar  | | GrabMart | | GrabPay  | |
|  | Grablet  | | Grablet  | | Grablet  | | Grablet  | |
|  +----+-----+ +----+-----+ +----+-----+ +----+-----+ |
|       |             |             |             |       |
|  +----v-------------v-------------v-------------v-----+ |
|  |              Payment Orchestration Layer            | |
|  |  (Temporal Workflow Engine)                        | |
|  +----------------------------------------------------+ |
+----------------------------------------------------------+
```

Mỗi "Grablet" là một mini-app độc lập, có thể được enable/disable mà không ảnh hưởng đến các Grablet khác.

#### Temporal Workflow Engine

Grab sử dụng **Temporal** (formerly Cadence) để orchestrate long-running payment flows:

```
PaymentWorkflow (Temporal)
  |
  +-- Activity: ValidatePaymentRequest
  +-- Activity: CheckFraudScore
  +-- Activity: RouteToProvider (BIN-based routing)
  +-- Activity: ExecutePayment
  +-- Activity: HandleProviderResponse
  +-- Activity: UpdateLedger
  +-- Activity: SendNotification
  |
  +-- Signal: UserCancelled -> compensate
  +-- Signal: ProviderTimeout -> retry with backoff
  +-- Signal: RecoverySignal -> resume from checkpoint
```

Temporal đảm bảo **exactly-once execution** — nếu workflow bị interrupt (server crash, network failure), nó sẽ resume từ checkpoint cuối cùng.

#### Kafka-backed Event Sourcing — Coban Platform

```
Payment Events (300B+ events/week)
         |
         v
+------------------+
|   Coban Platform  |  (Grab internal Kafka-based event streaming)
|  (Kafka + Flink)  |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
Real-time   Batch
Analytics   Reconciliation
Fraud       Settlement
Detection   Reporting
```

#### Service Mesh — Istio + Grab-Kit

Grab sử dụng Istio service mesh với circuit breakers tích hợp:

```
Payment Service
    |
    +-- Istio Sidecar (Envoy proxy)
    |     |
    |     +-- Circuit Breaker (open khi error rate > threshold)
    |     +-- Retry with exponential backoff
    |     +-- Timeout enforcement
    |     +-- mTLS between services
    |
    +-- Grab-Kit (internal framework)
          |
          +-- Service discovery
          +-- Load balancing
          +-- Distributed tracing (Jaeger)
```

**Kết quả**: 80% reduction in production incidents so với legacy system.

---

### 4.3 Enterprise Payment Orchestration Layer

Mô hình enterprise payment orchestration có 5 layers:

```
+----------------------------------------------------------+
|  Layer 1: API Ingestion & Normalization                  |
|  - Validate request schema                               |
|  - Normalize amount, currency, metadata                  |
|  - Rate limiting, DDoS protection                        |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|  Layer 2: Routing Engine                                 |
|  - BIN-based routing (Visa/MC/JCB -> different acquirer) |
|  - Issuer routing (VCB, TCB, ACB...)                     |
|  - Amount-based routing (high-value -> premium provider) |
|  - Risk score routing (high-risk -> 3DS mandatory)       |
|  - Provider health check (failover if error rate > 5%)   |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|  Layer 3: Compliance Middleware                          |
|  - Sanctions screening (OFAC, UN, EU lists)              |
|  - KYC/KYB verification                                  |
|  - Velocity checks (max N transactions per hour)         |
|  - AML pattern detection                                 |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|  Layer 4: Settlement & Reconciliation                    |
|  - Double-entry ledger (debit/credit)                    |
|  - T+1 / T+2 settlement cycles                          |
|  - Automated reconciliation with provider statements     |
|  - Dispute management                                    |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|  Layer 5: Observability & Alerting                       |
|  - Distributed tracing (Jaeger/Zipkin)                   |
|  - Metrics (Prometheus + Grafana)                        |
|  - Anomaly detection (ML-based)                          |
|  - PagerDuty integration                                 |
+----------------------------------------------------------+
```

---

## 5. So sánh chi tiết: Hệ thống hiện tại vs Enterprise

### 5.1 Bảng so sánh tổng quan

| Tiêu chí                   | Hệ thống hiện tại                           | ShopeePay/GrabPay                     | Enterprise Standard                       |
| -------------------------- | ------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| **Provider abstraction**   | Strategy Pattern (IPaymentProvider)         | Internal SDK per provider             | Unified Payment Orchestration API         |
| **State management**       | Implicit (DB status field)                  | Explicit state machine                | Formal FSM với audit log                  |
| **Idempotency**            | idempotencyKey unique index + session check | reference_id (ShopeePay)              | Distributed idempotency với TTL           |
| **Webhook security**       | HMAC verify + IP whitelist (MoMo)           | Bidirectional HMAC (ShopeePay)        | mTLS + HMAC + IP allowlist                |
| **Failure recovery**       | ReconciliationJob (24h polling)             | Temporal workflow (checkpoint resume) | Saga pattern + compensating transactions  |
| **Real-time notification** | Socket.IO emit sau IPN                      | Push notification + webhook           | Event streaming (Kafka)                   |
| **Observability**          | Sliding-window metrics (5min)               | Distributed tracing (Jaeger)          | Full APM: traces + metrics + logs         |
| **Routing**                | Manual switch/case                          | BIN-based routing engine              | ML-based dynamic routing                  |
| **Compliance**             | Basic validation                            | KYC/KYB tích hợp                      | Full AML + sanctions screening            |
| **Settlement**             | Không có                                    | T+1/T+2 cycles                        | Double-entry ledger + auto-reconciliation |

### 5.2 So sánh Flow xử lý IPN

```
Hệ thống hiện tại (MoMo IPN):
  POST /payment/momo/ipn
    -> Rate limit check
    -> IP whitelist (production)
    -> HMAC-SHA256 verify
    -> Parse result
    -> Mongoose transaction:
         check session idempotency
         validate amount
         update session status
    -> setImmediate: createOrderFromSession
    -> HTTP 204

ShopeePay (Webhook):
  POST /webhook
    -> Verify webhook_secret HMAC
    -> Validate session_id exists
    -> State machine transition check
    -> Distributed lock (Redis)
    -> Update session state
    -> Publish event to Kafka
    -> HTTP 200 {received: true}

GrabPay (Temporal Workflow):
  Signal: PaymentConfirmed
    -> Temporal resumes workflow from checkpoint
    -> Activity: UpdateLedger
    -> Activity: SendNotification
    -> Workflow completes (exactly-once)
```

### 5.3 So sánh Error Handling

| Scenario              | Hệ thống hiện tại              | Enterprise approach                            |
| --------------------- | ------------------------------ | ---------------------------------------------- |
| IPN không nhận được   | ReconciliationJob sau 24h      | Temporal retry với exponential backoff         |
| Provider timeout      | Không có circuit breaker       | Istio circuit breaker (error rate > threshold) |
| Duplicate IPN         | Session status check           | Distributed lock + idempotency store           |
| Payment stuck PENDING | Reconciliation query sau 30min | Workflow timeout signal + compensate           |
| Provider down         | Throw error, no fallback       | BIN routing failover sang provider khác        |

---

## 6. Gap Analysis — Điểm mạnh và thiếu sót

### 6.1 Điểm mạnh của hệ thống hiện tại

#### Clean Architecture

Strategy Pattern + Repository Pattern được implement đúng cách. Thêm provider mới (ZaloPay, PayOS) chỉ cần:

1. Implement `IPaymentProvider` (4 methods)
2. Register trong `PaymentService.getProvider()`
3. Không sửa bất kỳ business logic nào khác

#### Pre-order Session Pattern

Giải quyết vấn đề "ghost order" — order chỉ được tạo khi payment thực sự thành công. Đây là pattern đúng cho e-wallet redirect flows, tránh:

- Order tồn tại nhưng không có payment
- Inventory bị lock không cần thiết
- User confusion khi thấy order "pending" mãi

#### Multi-layer Idempotency

Idempotency được implement ở nhiều tầng độc lập — nếu một tầng fail, tầng khác vẫn bảo vệ:

- Database unique index (`idempotencyKey`)
- Session status check trước khi process
- `stripe_event_id` unique index cho Stripe

#### Proactive Monitoring

Sliding-window failure rate alert (5 phút, 10% threshold) phát hiện vấn đề trước khi user report. Debounce 60s tránh alert flooding.

#### Safety Net Reconciliation

`PaymentReconciliationJob` đảm bảo không có payment nào bị stuck mãi mãi — ngay cả khi IPN bị miss hoàn toàn.

---

### 6.2 Gaps so với Enterprise Standard

#### Gap 1: Không có Circuit Breaker

**Vấn đề**: Nếu MoMo API down, mọi payment request sẽ timeout và throw error. Không có fallback.

**Enterprise solution**: Circuit breaker pattern — sau N failures, "open" circuit và fail fast (không chờ timeout). Sau cooldown period, "half-open" để test recovery.

```
// Ví dụ với opossum (Node.js circuit breaker)
const breaker = new CircuitBreaker(momoProvider.createPayment, {
  timeout: 3000,          // Fail nếu > 3s
  errorThresholdPercentage: 50,  // Open khi > 50% fail
  resetTimeout: 30000,    // Thử lại sau 30s
})
```

#### Gap 2: Không có Provider Failover

**Vấn đề**: Nếu VNPay down, không có cơ chế tự động route sang provider khác.

**Enterprise solution**: Routing engine với health check — monitor error rate per provider, tự động failover khi error rate > threshold.

#### Gap 3: Reconciliation Interval quá dài (24h)

**Vấn đề**: Payment bị stuck có thể tồn tại 24h trước khi được resolve.

**Enterprise solution**: Giảm interval xuống 15-30 phút cho stale payments. Hoặc dùng event-driven approach — provider gửi webhook khi status thay đổi.

#### Gap 4: Không có Distributed Tracing

**Vấn đề**: Khi payment fail, khó trace được request đi qua những service nào, tốn bao nhiêu thời gian ở mỗi bước.

**Enterprise solution**: OpenTelemetry + Jaeger/Zipkin — mỗi request có trace_id, span cho mỗi operation.

#### Gap 5: Không có Settlement Layer

**Vấn đề**: Hệ thống không track tiền thực sự đã được transfer chưa (payment success != funds settled).

**Enterprise solution**: Double-entry ledger — mỗi payment tạo debit/credit entries. Reconcile với provider statements hàng ngày.

#### Gap 6: Implicit State Machine

**Vấn đề**: Payment status transitions không được enforce — code có thể set bất kỳ status nào từ bất kỳ status nào.

**Enterprise solution**: Explicit FSM với allowed transitions:

```
PENDING -> SUCCESS | FAILED | CANCELLED
SUCCESS -> REFUNDED
FAILED  -> (terminal)
// Bất kỳ transition nào khác -> throw InvalidStateTransitionError
```

---

## 7. Roadmap — Hướng phát triển

Dựa trên gap analysis, đây là roadmap theo 5 layers từ nền tảng đến enterprise-grade:

### Layer 1: Stability (Ưu tiên cao — 1-2 tháng)

| Task                             | Mô tả                                            | Impact                |
| -------------------------------- | ------------------------------------------------ | --------------------- |
| [x] Idempotency multi-layer      | idempotencyKey + session check + stripe_event_id | Đã có                 |
| [x] Reconciliation job           | 24h polling cho stale payments                   | Đã có                 |
| [x] Sliding-window metrics       | 5min failure rate alert                          | Đã có                 |
| [ ] Circuit breaker              | opossum hoặc custom implementation               | Tránh cascade failure |
| [ ] Giảm reconciliation interval | 24h -> 15-30 phút                                | Giảm thời gian stuck  |

### Layer 2: Resilience (Ưu tiên trung bình — 2-3 tháng)

| Task                       | Mô tả                                       | Impact                  |
| -------------------------- | ------------------------------------------- | ----------------------- |
| [ ] Provider health check  | Monitor error rate per provider             | Basis cho failover      |
| [ ] Automatic failover     | Route sang backup provider khi primary down | Zero-downtime payments  |
| [ ] Explicit state machine | FSM với allowed transitions enforcement     | Prevent invalid states  |
| [ ] Distributed lock       | Redis lock cho concurrent IPN processing    | Prevent race conditions |

### Layer 3: Observability (Ưu tiên trung bình — 2-3 tháng)

| Task                          | Mô tả                                        | Impact                   |
| ----------------------------- | -------------------------------------------- | ------------------------ |
| [ ] OpenTelemetry integration | Distributed tracing cho payment flows        | Debug production issues  |
| [ ] Structured logging        | Correlation ID qua toàn bộ request lifecycle | Faster incident response |
| [ ] Prometheus metrics        | Payment success rate, latency histograms     | SLA monitoring           |
| [ ] Grafana dashboard         | Real-time payment health visualization       | Ops visibility           |

### Layer 4: Compliance (Ưu tiên thấp — 3-6 tháng)

| Task                         | Mô tả                                      | Impact                 |
| ---------------------------- | ------------------------------------------ | ---------------------- |
| [ ] Velocity checks          | Max N transactions per user per hour       | Fraud prevention       |
| [ ] Amount anomaly detection | Alert khi amount bất thường                | AML basic              |
| [ ] Audit trail              | Immutable log cho mọi payment state change | Compliance requirement |
| [ ] PCI-DSS review           | Đảm bảo không lưu card data                | Security compliance    |

### Layer 5: Scale (Dài hạn — 6+ tháng)

| Task                   | Mô tả                                    | Impact                    |
| ---------------------- | ---------------------------------------- | ------------------------- |
| [ ] Settlement layer   | Double-entry ledger + T+1 reconciliation | Financial accuracy        |
| [ ] Event sourcing     | Kafka-backed payment events              | Audit + replay capability |
| [ ] BIN-based routing  | Route theo card type/issuer              | Optimize success rate     |
| [ ] ML fraud detection | Pattern-based anomaly detection          | Reduce chargebacks        |

---

## 8. Kết luận

### 8.1 Tóm tắt kiến trúc

Hệ thống payment của shopee-project được xây dựng trên nền tảng vững chắc với các patterns đúng đắn:

- **Strategy Pattern** cho provider abstraction — extensible, testable
- **Repository Pattern** cho data access — separation of concerns
- **Session Pattern** cho pre-order flows — tránh ghost orders
- **Multi-layer Idempotency** — database + application level
- **Reconciliation Job** — safety net cho missed IPNs

Kiến trúc này phù hợp cho scale hiện tại và có thể handle hàng nghìn giao dịch/ngày mà không cần thay đổi lớn.

### 8.2 Điểm khác biệt chính với ShopeePay/GrabPay

ShopeePay và GrabPay được thiết kế cho scale hàng triệu giao dịch/ngày với các yêu cầu khác:

| Yếu tố            | Hệ thống hiện tại        | ShopeePay/GrabPay            |
| ----------------- | ------------------------ | ---------------------------- |
| Scale target      | Nghìn tx/ngày            | Triệu tx/ngày                |
| Team size         | Small team               | Hundreds of engineers        |
| Compliance        | Basic                    | PCI-DSS Level 1, MAS, BNM    |
| Infrastructure    | Single service           | Microservices + service mesh |
| Failure tolerance | Minutes (reconciliation) | Seconds (Temporal workflow)  |

Sự khác biệt này không có nghĩa là hệ thống hiện tại "kém" — nó phù hợp với context và constraints hiện tại.

### 8.3 Nguyên tắc thiết kế cốt lõi

Nhìn lại toàn bộ codebase, có 3 nguyên tắc nhất quán:

**1. Defense in depth**: Mỗi security/reliability concern được xử lý ở nhiều tầng độc lập. Nếu một tầng fail, tầng khác vẫn bảo vệ.

**2. Fail fast, recover gracefully**: IPN handlers trả về response ngay lập tức (204/200), xử lý business logic async. Reconciliation job đảm bảo eventual consistency.

**3. Explicit over implicit**: Signature verification, amount validation, idempotency check — tất cả đều explicit, không assume provider đã làm đúng.

### 8.4 Tài liệu liên quan

| Tài liệu                                       | Nội dung                           |
| ---------------------------------------------- | ---------------------------------- |
| ZZ_11_STRIPE_PAYMENT_INTEGRATION_DEEP_DIVE.md  | Chi tiết Stripe PaymentIntent flow |
| ZZ_12_SECURITY_ARCHITECTURE_ANALYSIS.md        | Security patterns toàn hệ thống    |
| ZZ_13_PAYMENT_GATEWAY_ARCHITECTURE_ANALYSIS.md | Tài liệu này                       |

---

_Tài liệu này được tạo dựa trên phân tích trực tiếp source code của shopee-project. Các so sánh với ShopeePay/GrabPay dựa trên tài liệu công khai và engineering blog posts của các công ty._
