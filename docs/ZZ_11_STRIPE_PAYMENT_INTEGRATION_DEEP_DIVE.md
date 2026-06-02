# STRIPE PAYMENT INTEGRATION — DEEP DIVE

> **Tài liệu phân tích chi tiết về Stripe Payment Integration trong shopee-project**
>
> **Ngày tạo:** 10/05/2026
> **Specs liên quan:** `stripe-payment-integration`, `stripe-payment-recovery`

---

## MỤC LỤC

1. [PaymentIntent là gì và tại sao cần nó](#1-paymentintent-là-gì-và-tại-sao-cần-nó)
2. [CardElement và PCI Compliance](#2-cardelement-và-pci-compliance)
3. [Webhook Flow chi tiết](#3-webhook-flow-chi-tiết)
4. [confirmCardPayment — Promise behavior và UI redirect](#4-confirmcardpayment--promise-behavior-và-ui-redirect)
5. [3DS (3D Secure) hoạt động chi tiết](#5-3ds-3d-secure-hoạt-động-chi-tiết)
6. [Tại sao express.raw() phải đặt trước express.json()](#6-tại-sao-expressraw-phải-đặt-trước-expressjson)
7. [Client Secret Recovery — Flow khi user refresh trang giữa chừng](#7-client-secret-recovery--flow-khi-user-refresh-trang-giữa-chừng)
8. [Recovery UI — Code Pattern cụ thể](#8-recovery-ui--code-pattern-cụ-thể)
9. [Test 3DS Flow trong Development với Stripe Test Cards](#9-test-3ds-flow-trong-development-với-stripe-test-cards)
10. [Xử lý khi user có nhiều order pending cùng lúc](#10-xử-lý-khi-user-có-nhiều-order-pending-cùng-lúc)

---

## 1. PaymentIntent là gì và tại sao cần nó

### Vấn đề hiện tại

Trong `shopee-api`, enum `PAYMENT_METHOD.CREDIT_CARD` tồn tại nhưng không có payment processor nào xử lý. Order được tạo với `status: 'pending'` và không bao giờ được charge. Đây là production blocker.

### PaymentIntent giải quyết gì

PaymentIntent là object phía Stripe đại diện cho "ý định thu tiền" từ customer. Nó:

- Theo dõi lifecycle của một payment (created → requires_payment_method → requires_confirmation → succeeded/failed)
- Hỗ trợ 3DS/SCA authentication tự động
- Có `client_secret` — token an toàn để frontend confirm payment mà không cần expose secret key

### Flow tổng quan

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │   Stripe    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Place Order    │                   │
       │──────────────────>│                   │
       │                   │ 2. Create         │
       │                   │    PaymentIntent  │
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 3. Return PI +    │
       │                   │    client_secret  │
       │                   │<──────────────────│
       │ 4. Return         │                   │
       │    client_secret  │                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 5. confirmCardPayment(client_secret)  │
       │──────────────────────────────────────>│
       │                   │                   │
       │ 6. (3DS popup nếu cần)               │
       │<─────────────────────────────────────>│
       │                   │                   │
       │ 7. Payment result │                   │
       │<──────────────────────────────────────│
       │                   │                   │
       │                   │ 8. Webhook:       │
       │                   │    payment_intent │
       │                   │    .succeeded     │
       │                   │<──────────────────│
       │                   │                   │
       │                   │ 9. Update order   │
       │                   │    status = paid  │
       │                   │                   │
```

### VND là zero-decimal currency

Stripe xử lý VND khác USD. Một order 150,000 VND gửi lên Stripe là `amount: 150000` (KHÔNG chia 100). Đây là lỗi phổ biến nhất khi integrate Stripe với VND.

```typescript
// ĐÚNG — VND là zero-decimal
const paymentIntent = await stripe.paymentIntents.create({
  amount: order.total, // 150000 = 150,000 VND
  currency: 'vnd',
})

// SAI — sẽ charge 1,500 VND thay vì 150,000 VND
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(order.total / 100), // KHÔNG LÀM THẾ NÀY
  currency: 'vnd',
})
```

---

## 2. CardElement và PCI Compliance

### CardElement là gì

`CardElement` từ `@stripe/react-stripe-js` render một iframe do Stripe host. Card data (number, expiry, CVC) KHÔNG BAO GIỜ đi qua server của mình.

```
┌─────────────────────────────────────────────┐
│  Checkout Page (our domain)                 │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  CardElement (Stripe iframe)        │    │
│  │  ┌───────────────────────────────┐  │    │
│  │  │ 4242 4242 4242 4242  12/28 123│  │    │
│  │  └───────────────────────────────┘  │    │
│  │  Card data stays HERE — never       │    │
│  │  leaves Stripe's iframe             │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Place Order] ← triggers confirmCardPayment│
└─────────────────────────────────────────────┘
```

### PCI Compliance level

- **Không dùng Stripe**: PCI DSS Level 1 (audit hàng năm, penetration test, $$$)
- **Dùng CardElement**: PCI DSS SAQ A (self-assessment questionnaire, đơn giản nhất)

### Styling CardElement

CardElement nhận `style` prop để match design system:

```typescript
const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: { color: '#ee4d2d' }, // Shopee orange for errors
  },
  hidePostalCode: true, // VN không dùng postal code
}
```

---

## 3. Webhook Flow chi tiết

### Tại sao cần webhook

`confirmCardPayment` resolve ở frontend KHÔNG đảm bảo payment thực sự thành công. Network có thể drop giữa chừng. Webhook là source of truth — Stripe gọi server của mình để confirm.

### Sequence diagram

```
Frontend                    Backend                     Stripe
   │                          │                          │
   │ confirmCardPayment()     │                          │
   │─────────────────────────────────────────────────────>│
   │                          │                          │
   │ ← resolve (succeeded)   │                          │
   │<─────────────────────────────────────────────────────│
   │                          │                          │
   │ navigate(/success)       │   POST /webhook          │
   │                          │<─────────────────────────│
   │                          │                          │
   │                          │ 1. Verify signature      │
   │                          │ 2. Check idempotency     │
   │                          │ 3. Update order status   │
   │                          │ 4. Log event             │
   │                          │                          │
   │                          │ 200 OK                   │
   │                          │─────────────────────────>│
```

### Events quan trọng

| Event                           | Ý nghĩa              | Action                                                     |
| ------------------------------- | -------------------- | ---------------------------------------------------------- |
| `payment_intent.succeeded`      | Payment thành công   | Set `payment_status: 'paid'`, clear `stripe_client_secret` |
| `payment_intent.payment_failed` | Card bị decline      | Set `payment_status: 'failed'`                             |
| `payment_intent.canceled`       | PI expired/cancelled | Clear `stripe_client_secret`                               |

### Idempotency

Stripe có thể gửi cùng một event nhiều lần. `PaymentLog` model lưu `stripe_event_id`:

```typescript
// Trước khi xử lý event
const existing = await PaymentLog.findOne({ stripe_event_id: event.id })
if (existing) return res.status(200).json({ received: true }) // Skip

// Xử lý event...
await PaymentLog.create({ stripe_event_id: event.id, type: event.type, ... })
```

---

## 4. confirmCardPayment — Promise behavior và UI redirect

### Quan trọng: confirmCardPayment KHÔNG reject khi payment fail

```typescript
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement },
})

// error !== undefined → payment failed (card declined, expired, etc.)
// paymentIntent.status === 'succeeded' → payment OK
// paymentIntent.status === 'requires_action' → 3DS needed (handled automatically)
```

### UI redirect logic

```typescript
if (error) {
  // Card declined, expired, etc.
  toast.error(error.message)
  // KHÔNG redirect — user có thể thử lại với card khác
} else if (paymentIntent?.status === 'succeeded') {
  // Payment thành công
  navigate(`/payment/success?orderId=${orderId}`)
} else {
  // Unexpected state
  toast.error('Payment could not be completed')
}
```

### Tại sao không dùng try/catch

`confirmCardPayment` resolve cả khi payment fail — nó chỉ reject khi có network error hoặc SDK error. Payment failure là business logic, không phải exception:

```typescript
// SAI — catch không bắt được card declined
try {
  const result = await stripe.confirmCardPayment(...)
  navigate('/success') // BUG: sẽ redirect cả khi card declined!
} catch (e) {
  toast.error(e.message) // Chỉ bắt network errors
}

// ĐÚNG — check error field
const { error, paymentIntent } = await stripe.confirmCardPayment(...)
if (error) {
  toast.error(error.message) // Card declined, expired, etc.
} else if (paymentIntent.status === 'succeeded') {
  navigate('/success')
}
```

---

## 5. 3DS (3D Secure) hoạt động chi tiết

### 3DS là gì

3D Secure (3DS) là protocol xác thực thêm một bước khi thanh toán online. Khi bank yêu cầu 3DS, user phải xác nhận qua OTP, fingerprint, hoặc app banking.

### Flow 3DS trong Stripe

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Frontend │    │  Stripe  │    │  Bank    │    │  User    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ confirmCard   │               │               │
     │ Payment()     │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ Check: card   │               │
     │               │ requires 3DS? │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │ Yes, 3DS      │               │
     │               │ required      │               │
     │               │<──────────────│               │
     │               │               │               │
     │ Open 3DS      │               │               │
     │ modal/popup   │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Show 3DS challenge ──────────────────────────>│
     │               │               │               │
     │               │               │  Enter OTP    │
     │               │               │<──────────────│
     │               │               │               │
     │               │  Verify OTP   │               │
     │               │<──────────────│               │
     │               │               │               │
     │ 3DS complete  │               │               │
     │ (auto-close   │               │               │
     │  modal)       │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Promise       │               │               │
     │ resolves with │               │               │
     │ succeeded     │               │               │
     │<──────────────│               │               │
```

### Stripe tự động handle 3DS

Developer KHÔNG cần code gì thêm cho 3DS. `confirmCardPayment` tự động:

1. Detect card cần 3DS hay không
2. Mở popup/modal cho user xác thực
3. Đợi user hoàn thành
4. Resolve promise sau khi 3DS xong

```typescript
// Code KHÔNG thay đổi dù card có 3DS hay không
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement },
})
// Stripe SDK tự xử lý 3DS popup ở giữa
// Promise chỉ resolve SAU KHI 3DS hoàn thành (hoặc user cancel)
```

### 3DS failure cases

| Trường hợp                               | `error.code`                            | Xử lý                          |
| ---------------------------------------- | --------------------------------------- | ------------------------------ |
| User cancel 3DS popup                    | `payment_intent_authentication_failure` | Toast "Xác thực bị hủy"        |
| OTP sai 3 lần                            | `payment_intent_authentication_failure` | Toast "Xác thực thất bại"      |
| Bank timeout                             | `payment_intent_authentication_failure` | Toast "Hết thời gian xác thực" |
| Card không hỗ trợ 3DS nhưng bank yêu cầu | `card_declined`                         | Toast error.message            |

### Khi nào 3DS được trigger

- **Luôn luôn**: Cards ở EU (PSD2/SCA regulation bắt buộc)
- **Tùy bank**: Cards ở VN — Vietcombank, Techcombank thường yêu cầu OTP cho giao dịch online
- **Radar rules**: Stripe Radar có thể force 3DS cho giao dịch suspicious
- **Manual**: Có thể force 3DS qua `payment_intent.confirmation_method = 'manual'`

---

## 6. Tại sao express.raw() phải đặt trước express.json()

### Vấn đề

Stripe webhook verification cần **raw request body** (Buffer) để verify signature. Nhưng `express.json()` middleware parse body thành JSON object và **consume stream** — sau đó không thể đọc raw body nữa.

### Giải thích kỹ thuật

```
HTTP Request arrives
       │
       ▼
┌─────────────────────────────────────────────┐
│ Request body là một readable stream         │
│ Chỉ có thể đọc MỘT LẦN                    │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ express.json() đọc stream → parse JSON      │
│ Stream bây giờ EMPTY                        │
│ req.body = { type: "payment_intent..." }    │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Webhook handler cần raw body để verify      │
│ stripe.webhooks.constructEvent(             │
│   rawBody,  ← CẦN Buffer, nhưng stream     │
│   sig,         đã bị consume!              │
│   secret                                    │
│ )                                           │
│ → CRASH: rawBody is undefined               │
└─────────────────────────────────────────────┘
```

### Solution: Route-specific raw body middleware

```typescript
// src/index.ts — TRƯỚC express.json()

// Webhook route cần raw body
app.use('/payment/stripe/webhook', express.raw({ type: 'application/json' }))

// Tất cả route khác dùng JSON parsing bình thường
app.use(express.json({ limit: '10mb' }))
```

### Tại sao không dùng `verify` option của express.json()

Có cách khác: dùng `verify` callback để lưu raw body:

```typescript
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf // Lưu raw body trước khi parse
    },
  }),
)
```

Nhưng cách này **không tốt** vì:

- Lưu raw body cho MỌI request (waste memory)
- Phải cast `req` sang custom type
- Không rõ ràng — dễ quên khi refactor

Cách route-specific `express.raw()` tốt hơn vì chỉ áp dụng cho webhook route.

---

## 7. Client Secret Recovery — Flow khi user refresh trang giữa chừng

### Vấn đề

Khi user đặt order credit card:

1. Backend tạo PaymentIntent, lưu `stripe_client_secret` vào Order document
2. Frontend nhận `client_secret` trong response, lưu vào React state
3. User nhập card, click "Thanh toán"
4. **Nhưng nếu user refresh trang trước bước 3** → React state mất → `client_secret` mất → không thể confirm payment

Order vẫn pending trong DB, PaymentIntent vẫn active trên Stripe, nhưng frontend không có cách nào lấy lại `client_secret` để hoàn thành payment.

### Solution: Recovery từ DB

```
User refresh trang → vào /checkout
       │
       ▼
┌─────────────────────────────────────────────┐
│ GET /orders/pending-payment                 │
│ Query: user + credit_card + pending +       │
│        stripe_client_secret != null         │
│ Sort: createdAt DESC, limit 1              │
└─────────────────────────────────────────────┘
       │
       ├── Có order pending → Show Recovery Prompt
       │   "Bạn có đơn hàng chưa thanh toán"
       │   [Tiếp tục thanh toán] [Hủy đơn]
       │
       └── Không có → Show checkout form bình thường
```

### PaymentIntent expiry

Stripe PaymentIntent mặc định expire sau **24 giờ** (configurable). Khi expire:

- Stripe fire webhook `payment_intent.canceled`
- Backend set `stripe_client_secret: null` trên Order
- Lần sau user vào checkout → query trả `null` → không show recovery prompt
- User phải đặt order mới

### Best practices cho recovery

1. **Fail-open**: Nếu recovery query fail (network error), show checkout form bình thường — KHÔNG block user
2. **Single query, no polling**: Query một lần khi mount, `staleTime: Infinity`
3. **Guard expired PI**: Nếu `confirmCardPayment` trả `payment_intent_unexpected_state`, guide user cancel order
4. **Clear after success**: Sau khi payment thành công, webhook clear `stripe_client_secret` → lần sau không show prompt nữa

---

## 8. Recovery UI — Code Pattern cụ thể

### Component Architecture

```
Checkout.tsx
├── isPendingPaymentLoading? → <Loader />
├── pendingPaymentOrder? → <PendingPaymentPrompt />
│   ├── Warning header (order total)
│   ├── <StripeCardForm /> (CardElement)
│   ├── [Tiếp tục thanh toán] button
│   └── [Hủy đơn hàng] button
└── else → Normal checkout form (unchanged)
```

### useCheckout.ts — Recovery detection

```typescript
// Thêm vào useCheckout hook
const { data: pendingPaymentData, isLoading: isPendingPaymentLoading } = useQuery({
  queryKey: ['pendingPayment'],
  queryFn: () => orderApi.getPendingPaymentOrder(),
  staleTime: Infinity, // Chỉ fetch 1 lần
  retry: false, // Fail-open: không retry
})

const pendingPaymentOrder = pendingPaymentData?.data?.data ?? null
```

### PendingPaymentPrompt — Core logic

```typescript
const handleResume = async () => {
  // Guard 1: Stripe SDK loaded?
  if (!stripe || !elements) {
    toast.error(t('recovery.stripeNotReady'))
    return
  }

  // Guard 2: Card element mounted?
  const cardElement = elements.getElement(CardElement)
  if (!cardElement) {
    toast.error(t('recovery.cardNotReady'))
    return
  }

  // Guard 3: client_secret exists?
  if (!pendingOrder.stripe_client_secret) {
    toast.error(t('recovery.expiredError'))
    return
  }

  setIsConfirming(true)

  const { error, paymentIntent } = await stripe.confirmCardPayment(
    pendingOrder.stripe_client_secret,
    { payment_method: { card: cardElement } },
  )

  setIsConfirming(false)

  if (error) {
    if (error.code === 'payment_intent_unexpected_state' || error.code === 'resource_missing') {
      // PaymentIntent expired
      toast.error(t('recovery.expiredError'))
      setShowExpiredHint(true) // Highlight cancel button
    } else {
      toast.error(error.message || t('recovery.paymentFailed'))
    }
  } else if (paymentIntent?.status === 'succeeded') {
    onPaymentSuccess(pendingOrder._id)
  }
}
```

### Race condition cần lưu ý

`useCheckout.ts` có `useEffect` redirect về `/cart` khi `checkedItems.length === 0`. Nếu `handleRecoverySuccess` gọi `clearCheckedItems()` trước khi navigate, effect có thể fire trước:

```typescript
// Solution: navigate TRƯỚC khi clear items
const handleRecoverySuccess = (orderId: string) => {
  navigate(`/payment/success?orderId=${orderId}`, { replace: true })
  // Clear sau khi đã navigate — effect không fire vì component unmount
  queryClient.invalidateQueries({ queryKey: ['purchases'] })
  clearSessionStorage()
}
```

---

## 9. Test 3DS Flow trong Development với Stripe Test Cards

### Setup

```bash
# Terminal 1: Start Stripe webhook listener
stripe listen --forward-to localhost:4000/payment/stripe/webhook

# Terminal 2: Start backend
pnpm --filter shopee-api dev

# Terminal 3: Start frontend
pnpm --filter shopee-web dev
```

### Test cards cho các scenarios

| Card Number           | Behavior                           | Use case              |
| --------------------- | ---------------------------------- | --------------------- |
| `4242 4242 4242 4242` | Succeeds immediately (no 3DS)      | Happy path            |
| `4000 0025 0000 3155` | Requires 3DS authentication        | Test 3DS popup        |
| `4000 0000 0000 9995` | Always declined                    | Test decline handling |
| `4000 0000 0000 0002` | Declined after 3DS                 | Test 3DS + decline    |
| `4000 0027 6000 3184` | 3DS required, authentication fails | Test 3DS failure      |
| `4000 0000 0000 3220` | 3DS2 frictionless (auto-approve)   | Test 3DS2 no-popup    |

### Test 3DS popup trong development

1. Dùng card `4000 0025 0000 3155`
2. Click "Place Order"
3. Stripe SDK mở popup test: "Complete authentication" / "Fail authentication"
4. Click "Complete" → payment succeeds
5. Click "Fail" → error returned

### Test expired PaymentIntent

```bash
# Tạo order, KHÔNG confirm payment
# Đợi hoặc manually expire:
stripe payment_intents cancel pi_xxx

# Hoặc trong MongoDB:
db.orders.updateOne(
  { _id: ObjectId("...") },
  { $set: { stripe_client_secret: null } }
)
```

### Stripe CLI useful commands

```bash
# Trigger specific webhook event
stripe trigger payment_intent.succeeded

# List recent events
stripe events list --limit 5

# Get PaymentIntent details
stripe payment_intents retrieve pi_xxx

# Forward webhooks to local server
stripe listen --forward-to localhost:4000/payment/stripe/webhook --events payment_intent.succeeded,payment_intent.payment_failed
```

---

## 10. Xử lý khi user có nhiều order pending cùng lúc

### Thực tế ở các doanh nghiệp lớn

**Shopee (thực tế):**

- Cho phép nhiều order pending cùng lúc (vì user mua từ nhiều seller)
- Mỗi order là independent — cancel 1 không ảnh hưởng order khác
- Credit card orders: giới hạn số lượng pending (thường 1-3) để tránh fraud
- COD orders: giới hạn cao hơn (5-10) vì risk thấp hơn

**Tiki:**

- Tương tự Shopee — nhiều COD pending OK
- Credit card: thường chỉ cho 1 pending tại một thời điểm
- Có mechanism auto-cancel order pending quá 24h

**Lazada:**

- Cho phép nhiều pending orders
- Credit card orders auto-cancel sau 30 phút nếu không complete payment

### Approach trong shopee-project

Spec `stripe-payment-recovery` chọn approach **"recover order mới nhất"**:

```typescript
// Query chỉ lấy 1 order mới nhất
const order = await OrderModel.findOne({
  user: new Types.ObjectId(userId),
  payment_method: PAYMENT_METHOD.CREDIT_CARD,
  payment_status: PAYMENT_STATUS.PENDING,
  stripe_client_secret: { $ne: null },
})
  .sort({ createdAt: -1 }) // Mới nhất
  .lean()
```

### Tại sao chỉ recover 1 order

1. **UX đơn giản**: Show 1 prompt rõ ràng, không overwhelm user
2. **Thực tế**: Rất hiếm khi user có >1 credit card order pending (phải refresh giữa chừng NHIỀU LẦN)
3. **Stripe PI expiry**: PaymentIntent expire sau 24h → orders cũ tự clear
4. **Avoid complexity**: UI cho multiple recovery sẽ phức tạp (list? carousel? priority?)

### Nếu muốn support multiple pending orders (future enhancement)

```typescript
// Option A: Return array, show list
const orders = await OrderModel.find({
  user: userId,
  payment_method: 'credit_card',
  payment_status: 'pending',
  stripe_client_secret: { $ne: null },
})
.sort({ createdAt: -1 })
.limit(5)
.lean()

// Option B: Auto-cancel old ones, keep newest
const [newest, ...older] = await OrderModel.find(...)
for (const old of older) {
  await stripe.paymentIntents.cancel(old.stripe_payment_intent_id)
  old.payment_status = 'cancelled'
  old.stripe_client_secret = null
  await old.save()
}
return newest
```

### Recommendation

Cho project hiện tại, **recover 1 order mới nhất** là đủ. Nếu sau này cần support multiple:

- Thêm endpoint `GET /orders/pending-payments` (plural) trả array
- UI: show list với "Thanh toán" / "Hủy" cho mỗi order
- Auto-cancel orders pending > 24h via cron job (không phụ thuộc Stripe webhook)

---

## Tổng kết — Verification Report cho spec `stripe-payment-recovery`

Spec đã được verify và fix 3 lỗi critical:

| #   | Lỗi                                                                       | Status |
| --- | ------------------------------------------------------------------------- | ------ |
| C1  | Task 2.1 thiếu dependency `stripe-payment-integration` Task 3             | Fixed  |
| C2  | Sort field `created_at` sai → phải là `createdAt` (Mongoose timestamps)   | Fixed  |
| C3  | Task 4.1 dependency "none" sai → cần `stripe-payment-integration` Task 13 | Fixed  |

### Warnings cần lưu ý khi implement

- **W3 (Race condition)**: `handleRecoverySuccess` clear items có thể trigger redirect effect → navigate trước khi clear
- **S1 (Index optimization)**: Compound index với `$ne: null` có thể không efficient → consider partial filter index
- **S2 (staleTime)**: `Infinity` nghĩa là cache không refresh → user cancel ở tab khác sẽ không update
