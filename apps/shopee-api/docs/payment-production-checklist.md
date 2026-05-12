# Payment Production Checklist

Use this checklist before going live with MoMo and VNPay payment processing.

---

## Merchant Account Setup

- [ ] MoMo production merchant account approved and active
- [ ] VNPay production merchant account approved and active
- [ ] MoMo production `partnerCode`, `accessKey`, and `secretKey` obtained from MoMo portal
- [ ] VNPay production `vnp_TmnCode` and `vnp_HashSecret` obtained from VNPay portal

---

## Production Credentials Configuration

- [ ] `MOMO_PARTNER_CODE` set to production value (not sandbox)
- [ ] `MOMO_ACCESS_KEY` set to production value
- [ ] `MOMO_SECRET_KEY` set to production value
- [ ] `MOMO_API_URL` set to `https://payment.momo.vn` (production endpoint)
- [ ] `VNPAY_TMN_CODE` set to production value
- [ ] `VNPAY_HASH_SECRET` set to production value
- [ ] `VNPAY_URL` set to `https://pay.vnpay.vn/vpcpay.html` (production endpoint)
- [ ] `APP_BASE_URL` set to the production backend URL (e.g., `https://api.yourdomain.com`)
- [ ] `FRONTEND_URL` set to the production frontend URL (e.g., `https://yourdomain.com`)
- [ ] All credentials stored in a secrets manager (not committed to source control)

---

## IP Whitelist Setup

- [ ] `MOMO_WHITELIST_IPS` configured with MoMo production IPN IP addresses:
  - `118.69.210.244`
  - `116.103.110.134`
- [ ] `NODE_ENV=production` set so the `momoIpWhitelist` middleware is active
- [ ] Firewall/load balancer configured to pass `X-Forwarded-For` headers correctly
- [ ] Verified that `req.ip` or `X-Forwarded-For` reflects the real client IP (not the load balancer IP)

---

## IPN URL Registration

- [ ] MoMo IPN URL registered in MoMo merchant portal: `https://<your-domain>/payment/momo/ipn`
- [ ] VNPay IPN URL registered in VNPay merchant portal: `https://<your-domain>/payment/vnpay/ipn`
- [ ] IPN URLs are publicly accessible (not behind VPN or firewall)
- [ ] IPN endpoints tested end-to-end with a real transaction in staging

---

## SSL/TLS Requirements

- [ ] Production backend served over HTTPS (required by both MoMo and VNPay)
- [ ] TLS certificate valid and not expired
- [ ] HSTS header enabled (`hsts` option in Helmet is set for production)
- [ ] HTTP to HTTPS redirect active (the `isProduction` redirect middleware in `index.ts`)

---

## Monitoring Setup

- [ ] `GET /health/metrics` endpoint monitored — check `payment.failed` counter
- [ ] Alerting configured for CRITICAL log entries from `payment-metrics.ts` (failure rate > 10%)
- [ ] Log aggregation set up to capture `[Payment]` prefixed log entries
- [ ] Uptime monitoring on `GET /health` and `GET /ready` endpoints
- [ ] Alert on HTTP 403 responses from `/payment/momo/ipn` (indicates IP whitelist rejections)

---

## Reconciliation Job Verification

- [ ] `RECONCILIATION_INTERVAL_HOURS` set to an appropriate value for production (default: `24`)
- [ ] Reconciliation job starts on server boot (confirmed in startup logs: `[ReconciliationJob] Starting payment reconciliation job`)
- [ ] `POST /admin/gateway-payments/reconcile-all` tested and returns correct summary JSON
- [ ] Admin authentication verified on the reconcile-all endpoint (unauthenticated request returns 401/403)
- [ ] Reconciliation run tested against a real stale PENDING payment in staging
