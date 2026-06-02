# Payment Sandbox Testing Guide

## MoMo Sandbox Setup

1. Register a MoMo sandbox account at https://developers.momo.vn
2. Obtain sandbox credentials:
   - `partnerCode`
   - `accessKey`
   - `secretKey`
3. Set environment variables:
   ```
   MOMO_PARTNER_CODE=<your_partner_code>
   MOMO_ACCESS_KEY=<your_access_key>
   MOMO_SECRET_KEY=<your_secret_key>
   MOMO_API_URL=https://test-payment.momo.vn
   ```
4. Use the MoMo sandbox app or test credentials provided in the developer portal to complete payments.
5. MoMo sandbox IPN callbacks are sent from the MoMo test servers — use ngrok for local testing (see below).

---

## VNPay Sandbox Setup

1. Register at https://sandbox.vnpayment.vn/devreg/
2. Obtain sandbox credentials:
   - `vnp_TmnCode` (terminal merchant code)
   - `vnp_HashSecret` (hash secret)
3. Set environment variables:
   ```
   VNPAY_TMN_CODE=<your_tmn_code>
   VNPAY_HASH_SECRET=<your_hash_secret>
   VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   ```
4. Use the following test card details to complete a VNPay sandbox payment:

   | Field           | Value               |
   | --------------- | ------------------- |
   | Card number     | 9704198526191432198 |
   | Cardholder name | NGUYEN VAN A        |
   | Expiry date     | 07/15               |
   | OTP             | 123456              |

5. VNPay IPN callbacks are sent as GET requests to your registered IPN URL.

---

## Local IPN Testing with ngrok

Since payment providers send IPN callbacks to a publicly accessible URL, you need ngrok (or a similar tunnel) for local development.

### Setup

1. Install ngrok: https://ngrok.com/download
2. Start your local backend server:
   ```bash
   npm run dev --workspace=apps/shopee-api
   ```
3. Start ngrok tunnel on the same port (default 4000):
   ```bash
   ngrok http 4000
   ```
4. Copy the HTTPS forwarding URL from ngrok output, e.g.:
   ```
   https://abc123.ngrok-free.app
   ```
5. Set `APP_BASE_URL` to the ngrok URL:
   ```
   APP_BASE_URL=https://abc123.ngrok-free.app
   ```

### IPN URL Format

| Provider | IPN URL                                 |
| -------- | --------------------------------------- |
| MoMo     | `https://<ngrok-url>/payment/momo/ipn`  |
| VNPay    | `https://<ngrok-url>/payment/vnpay/ipn` |

The backend constructs these URLs automatically from `APP_BASE_URL` when initiating a payment.

### Verifying IPN Receipt

Watch the backend logs for:

```
[Payment] IPN received { provider: "MOMO", orderId: "...", success: true }
[Payment] IPN processed { orderId: "...", newOrderStatus: "confirmed" }
```

---

## Common Issues and Troubleshooting

### MoMo: "Invalid signature"

- Verify `MOMO_SECRET_KEY` matches the value in the MoMo developer portal.
- Ensure the request body is not modified between receipt and signature verification.
- Check that `MOMO_PARTNER_CODE` and `MOMO_ACCESS_KEY` are correct.

### VNPay: "Invalid checksum"

- Verify `VNPAY_HASH_SECRET` matches the value in the VNPay merchant portal.
- VNPay uses HMAC-SHA512. Ensure query parameters are sorted alphabetically before hashing.
- Do not include `vnp_SecureHash` and `vnp_SecureHashType` in the hash input.

### IPN not received locally

- Confirm ngrok is running and `APP_BASE_URL` is set to the ngrok HTTPS URL.
- Check that the ngrok tunnel is forwarding to the correct port.
- Verify the IPN URL is registered in the provider's merchant portal (VNPay requires explicit registration).

### MoMo IPN returns 403 in production

- The `momoIpWhitelist` middleware rejects requests from non-whitelisted IPs in production.
- Ensure `MOMO_WHITELIST_IPS` includes the current MoMo production IPs: `118.69.210.244,116.103.110.134`.
- If MoMo adds new IPs, update `MOMO_WHITELIST_IPS` accordingly.

### Payment stuck in PENDING

- The reconciliation job runs every 24 hours by default.
- To trigger immediately: `POST /admin/gateway-payments/reconcile-all` (requires admin auth).
- Alternatively, reduce `RECONCILIATION_INTERVAL_HOURS` for faster reconciliation in staging.

### VNPay sandbox card declined

- Use exactly the test card details listed above (card `9704198526191432198`, name `NGUYEN VAN A`, expiry `07/15`, OTP `123456`).
- Ensure the payment amount is within VNPay sandbox limits.
