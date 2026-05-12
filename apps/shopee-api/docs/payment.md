# Payment Gateway Documentation

## Architecture Overview

The payment gateway integration supports MoMo and VNPay as payment providers. The system follows a provider-agnostic design using the `IPaymentProvider` interface, allowing new providers to be added without changing the core service logic.

```
Frontend (React)
    |
    | POST /orders/:id/initiate-payment
    v
PaymentController
    |
    v
PaymentService
    |-- MomoProvider  (createPayment, verifyIpn, parseIpnResult, queryStatus)
    |-- VnpayProvider (createPayment, verifyIpn, parseIpnResult, queryStatus)
    |
    v
PaymentRepository --> MongoDB (payments collection)
    |
    v
OrderModel (orders collection) -- status updated on IPN
```

Key components:

- `PaymentService` — orchestrates payment creation, IPN handling, status queries, and retries
- `PaymentRepository` — MongoDB CRUD for the `payments` collection
- `MomoProvider` / `VnpayProvider` — provider-specific API calls and signature verification
- `PaymentReconciliationJob` — background job that reconciles stale PENDING payments
- `payment-metrics.ts` — in-process counters and sliding-window failure-rate alert

---

## MoMo Payment Sequence Diagram

```
Frontend          Backend           MoMo API
   |                 |                  |
   |-- POST /orders/:id/initiate-payment -->|
   |                 |                  |
   |                 |-- POST /v2/gateway/api/create -->|
   |                 |<-- { payUrl, requestId }---------|
   |                 |                  |
   |<-- { paymentUrl } ------------------|
   |                 |                  |
   |-- redirect to payUrl ------------->|
   |                 |                  |
   |                 |<-- POST /payment/momo/ipn (IPN callback)
   |                 |    (signature verified, order updated)
   |                 |-- HTTP 204 ------>|
   |                 |                  |
   |<-- redirect to /payment/return?provider=momo&orderId=...
   |                 |                  |
   |-- GET /orders/:id/payment-status -->|
   |<-- { status: "SUCCESS" } ----------|
   |                 |                  |
   |-- navigate to /payment/success
```

---

## VNPay Payment Sequence Diagram

```
Frontend          Backend           VNPay API
   |                 |                  |
   |-- POST /orders/:id/initiate-payment -->|
   |                 |                  |
   |                 |-- Build vnp_* params + HMAC-SHA512 signature
   |                 |-- Redirect URL constructed (no API call needed)
   |                 |                  |
   |<-- { paymentUrl } ------------------|
   |                 |                  |
   |-- redirect to paymentUrl -------->|
   |                 |                  |
   |                 |<-- GET /payment/vnpay/ipn?vnp_*=... (IPN callback)
   |                 |    (signature verified, order updated)
   |                 |-- HTTP 200 { RspCode: "00" } -->|
   |                 |                  |
   |<-- redirect to /payment/return?provider=vnpay&orderId=...
   |                 |                  |
   |-- GET /orders/:id/payment-status -->|
   |<-- { status: "SUCCESS" } ----------|
   |                 |                  |
   |-- navigate to /payment/success
```

---

## Order Status State Machine

```
pending
  |
  +--(initiate payment)--> payment_pending
                               |
                               +--(IPN SUCCESS / reconcile SUCCESS)--> confirmed
                               |                                           |
                               +--(IPN FAILED / reconcile FAILED)---> payment_failed
                                                                          |
                                                                          +--(retry)--> payment_pending
```

Full status list:

| Status          | Description                                      |
|-----------------|--------------------------------------------------|
| `pending`       | Order created, awaiting payment initiation       |
| `payment_pending` | Payment initiated, awaiting IPN callback       |
| `payment_failed`  | Payment failed or timed out                    |
| `confirmed`     | Payment succeeded, order confirmed               |
| `processing`    | Order being prepared for shipment                |
| `shipping`      | Order shipped                                    |
| `delivered`     | Order delivered                                  |
| `cancelled`     | Order cancelled                                  |
| `returned`      | Order returned                                   |

---

## Error Handling and Retry Logic

### IPN Signature Verification Failure
- MoMo: HMAC-SHA256 signature checked against `MOMO_SECRET_KEY`
- VNPay: HMAC-SHA512 signature checked against `VNPAY_HASH_SECRET`
- On failure: HTTP 400 returned, payment not updated

### Amount Mismatch
- IPN amount is compared against the stored order total
- Tolerance: ±1 VND (floating-point rounding)
- On mismatch: payment marked FAILED, warning logged

### Duplicate IPN Delivery
- Idempotency check: if payment is already SUCCESS, IPN is silently ignored
- Mongoose transaction used to prevent race conditions

### Retry Payment
- `POST /orders/:id/retry-payment` creates a new payment attempt
- Previous FAILED payment record is preserved for audit
- Only allowed when latest payment is FAILED or PENDING with order in `payment_failed` state

### Reconciliation
- `PaymentReconciliationJob` runs every `RECONCILIATION_INTERVAL_HOURS` hours (default 24)
- Queries payments with status PENDING created more than 30 minutes ago
- Calls provider `queryStatus()` and applies transitions
- Manual trigger: `POST /admin/gateway-payments/reconcile-all`

---

## Configuration Reference

All payment-related environment variables with their defaults:

| Variable                       | Default                        | Description                                      |
|-------------------------------|--------------------------------|--------------------------------------------------|
| `MOMO_PARTNER_CODE`           | (required)                     | MoMo merchant partner code                      |
| `MOMO_ACCESS_KEY`             | (required)                     | MoMo access key                                  |
| `MOMO_SECRET_KEY`             | (required)                     | MoMo secret key for HMAC-SHA256 signature        |
| `MOMO_ENDPOINT`               | `https://test-payment.momo.vn` | MoMo API base URL                                |
| `MOMO_WHITELIST_IPS`          | `118.69.210.244,116.103.110.134` | Comma-separated MoMo IPN IP whitelist          |
| `VNPAY_TMN_CODE`              | (required)                     | VNPay terminal merchant code                     |
| `VNPAY_HASH_SECRET`           | (required)                     | VNPay hash secret for HMAC-SHA512 signature      |
| `VNPAY_URL`                   | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | VNPay payment URL      |
| `VNPAY_RETURN_URL`            | (derived from APP_BASE_URL)    | VNPay return URL after payment                   |
| `APP_BASE_URL`                | `http://localhost:4000`        | Backend base URL (used for IPN URL construction) |
| `FRONTEND_URL`                | `http://localhost:3000`        | Frontend base URL (used for return URL)          |
| `RECONCILIATION_INTERVAL_HOURS` | `24`                         | Hours between reconciliation job runs            |
