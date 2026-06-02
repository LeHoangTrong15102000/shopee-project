# Giải thích chi tiết: 2FA, Session, Backup Code & Audit Log

## Mục lục

1. [TOTP Secret là gì và tại sao server cần tạo nó?](#1-totp-secret-là-gì-và-tại-sao-server-cần-tạo-nó)
2. [Luồng đăng nhập với 2FA — Partial Token](#2-luồng-đăng-nhập-với-2fa--partial-token)
3. [Backup Code hoạt động như thế nào?](#3-backup-code-hoạt-động-như-thế-nào)
4. [Tại sao trả về `expires` và `expires_refresh_token`?](#4-tại-sao-trả-về-expires-và-expires_refresh_token)
5. [Partial Token — Mục đích và tại sao `/auth/2fa/complete` cần nó?](#5-partial-token--mục-đích-và-tại-sao-auth2facomplete-cần-nó)
6. [Session Model — Tại sao cần thêm model mới?](#6-session-model--tại-sao-cần-thêm-model-mới)
7. [Revoke Session — Luồng thu hồi phiên](#7-revoke-session--luồng-thu-hồi-phiên)
8. [Audit Log — Ghi nhật ký hành động](#8-audit-log--ghi-nhật-ký-hành-động)

---

## 1. TOTP Secret là gì và tại sao server cần tạo nó?

### TOTP là gì?

TOTP (Time-based One-Time Password) là thuật toán tạo mã xác thực 6 số thay đổi mỗi 30 giây. Nó hoạt động dựa trên:

- Một **secret key** (chuỗi base32) — chia sẻ giữa server và app authenticator
- **Thời gian hiện tại** — chia thành các khoảng 30 giây

### Tại sao server tạo TOTP secret?

```
Server tạo secret ──► Mã hóa AES-256-GCM ──► Lưu vào user.twoFactorSecret
                  │
                  └──► Tạo QR code ──► Trả về cho client ──► User quét bằng Google Authenticator
```

Server tạo secret vì:

1. **Server là nguồn tin cậy** — secret phải được tạo ngẫu nhiên bởi server, không phải client
2. **Cả hai bên cùng giữ secret** — server lưu (đã mã hóa), app authenticator cũng lưu (qua QR code)
3. **Để verify mã TOTP** — khi user nhập mã 6 số, server dùng secret + thời gian hiện tại để tính lại mã và so sánh

### Quy trình chi tiết:

```
1. Server: secret = otplib.authenticator.generateSecret()
   → Ví dụ: "JBSWY3DPEHPK3PXP"

2. Server: encrypted = AES-256-GCM(secret, TWO_FACTOR_ENCRYPTION_KEY)
   → Format: "iv:authTag:ciphertext" (hex)
   → Lưu vào user.twoFactorSecret

3. Server: qrCodeUrl = QRCode.toDataURL(otpauth://totp/Shopee:user@email.com?secret=JBSWY3DPEHPK3PXP)
   → Trả về cho client hiển thị

4. User quét QR → Google Authenticator lưu secret
   → Từ giờ app sẽ tạo mã 6 số mỗi 30 giây dựa trên secret này

5. User nhập mã 6 số vào POST /auth/2fa/verify-setup
   → Server: decrypt secret → tính TOTP từ secret + time → so sánh với mã user nhập
   → Nếu đúng: set twoFactorEnabled = true
```

### Tại sao mã hóa secret bằng AES-256-GCM?

Nếu database bị leak (bị hack), kẻ tấn công sẽ có tất cả TOTP secret → có thể tạo mã 6 số cho mọi user. Mã hóa bằng AES-256-GCM với key riêng (lưu trong env, KHÔNG lưu trong DB) đảm bảo:

- DB bị leak → secret vẫn an toàn (vì không có key để giải mã)
- Chỉ server có key mới decrypt được

---

## 2. Luồng đăng nhập với 2FA — Partial Token

### So sánh: Login thường vs Login có 2FA

**Login thường (2FA tắt):**

```
Client ──POST /auth/login { email, password }──► Server
       ◄── { access_token, refresh_token, expires, expires_refresh_token, user }
       (Xong! User có full quyền truy cập)
```

**Login có 2FA (2 bước):**

```
┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Xác thực mật khẩu                                           │
│                                                                       │
│ Client ──POST /auth/login { email, password }──► Server              │
│                                                                       │
│ Server:                                                               │
│   ✓ Kiểm tra email + password đúng                                   │
│   ✓ Phát hiện user.twoFactorEnabled === true                         │
│   → KHÔNG cấp full tokens                                            │
│   → Tạo partial_token = JWT { userId, scope: "2fa_pending", exp: 5m }│
│                                                                       │
│ Client ◄── { requires2FA: true, partial_token: "eyJ..." }           │
│                                                                       │
│ (Client hiển thị form nhập mã 6 số)                                  │
└─────────────────────────────────────────────────────────────────────┘

                    ⬇️ User mở Google Authenticator, lấy mã

┌─────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Xác thực yếu tố thứ 2                                       │
│                                                                       │
│ Client ──POST /auth/2fa/complete {                                   │
│   partial_token: "eyJ...",                                           │
│   code: "482901"                                                     │
│ }──► Server                                                          │
│                                                                       │
│ Server:                                                               │
│   ✓ Verify partial_token (chưa hết hạn, scope đúng)                 │
│   ✓ Decrypt user.twoFactorSecret                                    │
│   ✓ Verify TOTP code hoặc backup code                               │
│   → Cấp full tokens (access + refresh)                               │
│   → Tạo Session document                                             │
│   → Ghi LoginHistory                                                 │
│                                                                       │
│ Client ◄── { access_token, refresh_token, expires, ... , user }      │
│                                                                       │
│ (Xong! User có full quyền truy cập)                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Bảo vệ: Partial token KHÔNG dùng được ở endpoint khác

```
Client ──GET /api/products──► verifyAccessToken middleware
                               │
                               ├─ decode JWT
                               ├─ thấy scope === "2fa_pending"
                               └─ → HTTP 401 Unauthorized (từ chối)
```

Partial token chỉ có giá trị tại đúng 1 endpoint: `POST /auth/2fa/complete`.

---

## 3. Backup Code hoạt động như thế nào?

### Backup code là gì?

Backup code là 10 mã dự phòng (8 ký tự chữ+số) dùng khi user **mất điện thoại** hoặc **không truy cập được app authenticator**. Mỗi code chỉ dùng được **MỘT LẦN DUY NHẤT**.

### Quy trình tạo backup codes:

```
1. Server: codes = generateBackupCodes()
   → ["a1b2c3d4", "e5f6g7h8", "i9j0k1l2", ... ] (10 codes)

2. Server: hashes = codes.map(code => hashValue(code))
   → Mỗi code được hash bằng PBKDF2-SHA512
   → Format hash: "$12$salt$hash" (giống cách hash password)

3. Server: user.backupCodes = hashes (lưu 10 hash vào DB)

4. Server: trả plaintext codes cho user (CHỈ HIỂN THỊ 1 LẦN DUY NHẤT)
   → User phải lưu lại ở nơi an toàn
   → Server KHÔNG lưu plaintext, chỉ lưu hash
```

### Quy trình verify backup code khi đăng nhập:

```
User nhập code: "a1b2c3d4" vào POST /auth/2fa/complete

Server thực hiện:
┌──────────────────────────────────────────────────────────────┐
│ 1. Thử verify TOTP trước:                                    │
│    otplib.authenticator.verify({ token: "a1b2c3d4", secret })│
│    → Kết quả: FALSE (vì "a1b2c3d4" không phải mã 6 số)     │
│                                                               │
│ 2. TOTP sai → thử backup codes:                              │
│    Duyệt qua user.backupCodes (10 hash):                     │
│                                                               │
│    compareValue("a1b2c3d4", hash[0]) → FALSE                 │
│    compareValue("a1b2c3d4", hash[1]) → FALSE                 │
│    compareValue("a1b2c3d4", hash[2]) → TRUE ← Tìm thấy!    │
│                                                               │
│ 3. Match tại index 2 → XÓA hash[2] khỏi mảng:              │
│    user.backupCodes.splice(2, 1)                              │
│    → Còn lại 9 codes                                         │
│    → Save user                                                │
│                                                               │
│ 4. Cấp full tokens (giống như TOTP verify thành công)        │
└──────────────────────────────────────────────────────────────┘
```

### Tại sao mỗi backup code chỉ dùng 1 lần?

**Đúng, mỗi backup code chỉ dùng được 1 lần.** Lý do:

1. **Bảo mật** — Nếu code dùng lại được, kẻ tấn công chỉ cần đánh cắp 1 code là có quyền truy cập vĩnh viễn
2. **Giảm rủi ro** — Code bị lộ (ghi trên giấy, screenshot) chỉ nguy hiểm 1 lần
3. **Tiêu chuẩn ngành** — Google, GitHub, Discord đều dùng single-use backup codes

### Khi hết backup codes thì sao?

User có thể regenerate (tạo lại) 10 codes mới bằng `POST /auth/2fa/backup-codes` — nhưng phải nhập mã TOTP hợp lệ để xác nhận. Bộ codes cũ bị thay thế hoàn toàn.

---

## 4. Tại sao trả về `expires` và `expires_refresh_token`?

### Câu trả lời ngắn: Đúng, để client không phải decode token

```json
{
  "access_token": "Bearer eyJ...",
  "refresh_token": "eyJ...",
  "expires": 900,
  "expires_refresh_token": 604800,
  "user": { ... }
}
```

- `expires: 900` → access token hết hạn sau 900 giây (15 phút)
- `expires_refresh_token: 604800` → refresh token hết hạn sau 604800 giây (7 ngày)

### Tại sao không để client tự decode?

1. **Client không cần biết cấu trúc JWT** — token là opaque (hộp đen) đối với client
2. **Tránh lỗi timezone** — nếu client decode `exp` claim và tính toán, có thể sai do clock skew giữa server và client
3. **Đơn giản hóa logic client** — client chỉ cần:

   ```javascript
   // Lưu thời điểm nhận token
   const tokenReceivedAt = Date.now()
   const expiresAt = tokenReceivedAt + response.expires * 1000

   // Khi gọi API, kiểm tra:
   if (Date.now() > expiresAt - 60000) {
     // refresh trước 1 phút
     await refreshTokens()
   }
   ```

4. **Giảm kích thước bundle** — client không cần thư viện decode JWT (như `jwt-decode`)

---

## 5. Partial Token — Mục đích và tại sao `/auth/2fa/complete` cần nó?

### Vấn đề cần giải quyết

Khi user nhập đúng password nhưng chưa nhập mã 2FA, server cần "nhớ" rằng:

- User này đã xác thực password thành công
- User này cần hoàn thành bước 2FA
- Thông tin này chỉ có hiệu lực trong 5 phút

### Tại sao không để `/auth/2fa/complete` public (không cần token)?

Nếu endpoint public, request sẽ là:

```json
POST /auth/2fa/complete
{ "email": "user@example.com", "code": "123456" }
```

**Vấn đề bảo mật nghiêm trọng:**

- Kẻ tấn công có thể brute-force mã 6 số (chỉ 1 triệu tổ hợp) mà KHÔNG CẦN biết password
- Kẻ tấn công chỉ cần biết email → thử 1 triệu mã → vào được tài khoản
- 2FA trở thành yếu tố DUY NHẤT thay vì yếu tố THỨ HAI

### Partial token giải quyết như thế nào?

```
partial_token = JWT {
  id: "user_id_123",
  email: "user@example.com",
  roles: ["user"],
  scope: "2fa_pending",    ← đánh dấu đây là token tạm
  exp: 5 phút              ← hết hạn nhanh
}
```

**Đảm bảo:**

1. **Chứng minh đã qua bước 1** — chỉ ai có partial_token mới gọi được `/auth/2fa/complete`
2. **Không thể giả mạo** — token được ký bằng SECRET_KEY của server
3. **Hết hạn nhanh** — 5 phút, nếu user không hoàn thành thì phải login lại từ đầu
4. **Không dùng được ở nơi khác** — middleware `verifyAccessToken` từ chối token có `scope: "2fa_pending"`

### So sánh với các giải pháp khác:

| Giải pháp                 | Ưu điểm                           | Nhược điểm                         |
| ------------------------- | --------------------------------- | ---------------------------------- |
| **Partial token (JWT)** ★ | Stateless, không cần lưu DB/Redis | Token phải mang theo trong request |
| Session cookie            | Quen thuộc                        | Thêm cookie logic, CSRF concerns   |
| Redis key                 | Đơn giản                          | Thêm Redis dependency cho flow này |
| DB record                 | Persistent                        | Thêm model, cần cleanup            |

Chọn partial token vì: **stateless** (không cần lưu trạng thái ở server), phù hợp với kiến trúc JWT hiện tại.

---

## 6. Session Model — Tại sao cần thêm model mới?

### Hệ thống hiện tại đã có gì?

```
UserModel          — thông tin user (email, password, roles)
RefreshTokenModel  — tracking refresh token rotation (jti, revokedAt, rotatedFromJti)
```

RefreshToken model phục vụ mục đích **kỹ thuật**: phát hiện token bị đánh cắp (reuse detection). Nó KHÔNG phục vụ mục đích **user-facing**: cho user biết "tôi đang đăng nhập ở đâu".

### Vấn đề: User không có visibility

Hiện tại user KHÔNG THỂ:

- Xem danh sách thiết bị đang đăng nhập
- Biết có ai đang dùng tài khoản của mình
- Đăng xuất khỏi một thiết bị cụ thể
- Đăng xuất khỏi tất cả thiết bị (trừ thiết bị hiện tại)

Đây là tính năng bảo mật cơ bản mà Google, Facebook, GitHub đều có.

### Tại sao không dùng RefreshToken model luôn?

| Tiêu chí             | RefreshToken                        | Session (mới)                             |
| -------------------- | ----------------------------------- | ----------------------------------------- |
| Mục đích             | Rotation detection (kỹ thuật)       | User visibility (UX)                      |
| Thông tin            | jti, token hash, revokedAt          | device, IP, location, lastActive          |
| Lifecycle            | Bị revoke + tạo mới mỗi lần refresh | Tồn tại xuyên suốt, chỉ update lastActive |
| Hiển thị cho user    | KHÔNG                               | CÓ                                        |
| Số lượng per session | Nhiều (mỗi lần refresh tạo mới)     | 1 (cập nhật liên tục)                     |

**Vấn đề nếu dùng RefreshToken:**

- Mỗi lần refresh token, record cũ bị revoke, record mới được tạo → user thấy session "biến mất rồi xuất hiện lại"
- Không có thông tin device/IP/location
- Không có khái niệm "session liên tục"

### Session model giải quyết gì?

```
Session {
  user_id          — thuộc user nào
  accessJti        — để xác định "session hiện tại" (match với req.jwtDecoded.jti)
  refreshJti       — để tìm RefreshToken khi revoke
  refreshTokenHash — SHA-256(refreshJti), dùng khi refresh token (tìm session cũ)
  device           — "Chrome on Windows" (parse từ User-Agent)
  ip               — "192.168.1.1"
  location         — "Ho Chi Minh, VN" (từ geoip-lite)
  lastActive       — cập nhật mỗi lần refresh token
  expiresAt        — hết hạn cùng refresh token
  isRevoked        — đã bị thu hồi chưa
  createdAt        — lúc đăng nhập
}
```

### Có nên thêm model mới không? Phân tích:

**Ưu điểm:**

- User có thể quản lý sessions (tính năng bảo mật quan trọng)
- Tách biệt concerns: RefreshToken lo rotation, Session lo UX
- Không ảnh hưởng logic refresh token rotation hiện tại
- Dễ mở rộng (thêm "trusted device", "remember this device" sau này)

**Nhược điểm:**

- Thêm 1 model + 1 collection trong MongoDB
- Cần sync giữa Session và RefreshToken (khi revoke session phải xóa RefreshToken)
- Thêm write operation mỗi lần login/refresh

**Kết luận:** Đáng thêm. Lý do:

1. Đây là portfolio project — demonstrating session management là điểm cộng lớn
2. Overhead nhỏ (1 document per login, update on refresh)
3. Tính năng bảo mật chuẩn industry (Google, GitHub đều có)
4. Không phá vỡ logic hiện tại — Session là layer bổ sung, không thay thế RefreshToken

---

## 7. Revoke Session — Luồng thu hồi phiên

### 7.1 Revoke một session cụ thể

```
User xem danh sách sessions:
┌────────────────────────────────────────────────────┐
│ GET /auth/sessions                                  │
│                                                     │
│ Response:                                           │
│ [                                                   │
│   { id: "s1", device: "Chrome/Win", isCurrent: true },  │
│   { id: "s2", device: "Safari/iPhone", isCurrent: false },│
│   { id: "s3", device: "Firefox/Mac", isCurrent: false }, │
│ ]                                                   │
└────────────────────────────────────────────────────┘

User muốn đăng xuất khỏi iPhone:
┌────────────────────────────────────────────────────┐
│ DELETE /auth/sessions/s2                            │
│                                                     │
│ Server:                                             │
│   1. Tìm session s2, kiểm tra thuộc user này       │
│   2. Set session.isRevoked = true                   │
│   3. Xóa RefreshToken bằng:                        │
│      RefreshToken.findOneAndDelete({                │
│        jti: session.refreshJti                      │
│      })                                             │
│   4. → iPhone không thể refresh token nữa          │
│      → Access token hết hạn (15 phút) → bị đăng xuất│
│                                                     │
│ Response: { message: "Session revoked" }            │
└────────────────────────────────────────────────────┘
```

### 7.2 Revoke tất cả sessions (trừ hiện tại)

```
DELETE /auth/sessions

Server:
┌────────────────────────────────────────────────────────────┐
│ 1. Tìm current session:                                    │
│    currentSession = Session.findOne({                       │
│      user_id: userId,                                      │
│      accessJti: req.jwtDecoded.jti  ← từ access token     │
│    })                                                       │
│                                                             │
│ 2. Revoke tất cả sessions KHÁC:                            │
│    Session.updateMany(                                      │
│      { user_id: userId, _id: { $ne: currentSession._id } },│
│      { isRevoked: true }                                    │
│    )                                                        │
│                                                             │
│ 3. Thu thập refreshJti của các session bị revoke:          │
│    revokedJtis = revokedSessions.map(s => s.refreshJti)    │
│                                                             │
│ 4. Xóa RefreshToken tương ứng:                             │
│    RefreshToken.deleteMany({ jti: { $in: revokedJtis } })  │
│                                                             │
│ 5. Session hiện tại KHÔNG bị ảnh hưởng                     │
│    → User vẫn đăng nhập bình thường trên thiết bị này      │
└────────────────────────────────────────────────────────────┘

Response: { revokedCount: 2 }
```

### Tại sao cần xóa RefreshToken khi revoke session?

Nếu chỉ set `session.isRevoked = true` mà KHÔNG xóa RefreshToken:

- Thiết bị bị revoke vẫn có refresh token hợp lệ trong DB
- Nó có thể gọi refresh endpoint → nhận access token mới → vẫn truy cập được!

Phải xóa RefreshToken để đảm bảo: session bị revoke = không thể lấy token mới.

---

## 8. Audit Log — Ghi nhật ký hành động

### Audit log là gì?

Audit log ghi lại MỌI hành động quan trọng trong hệ thống: ai làm gì, lúc nào, từ đâu, thay đổi gì. Dùng để:

- Điều tra sự cố bảo mật
- Theo dõi hành vi admin
- Compliance (tuân thủ quy định)

### Cấu trúc một audit log entry:

```json
{
  "action": "product.update",
  "resource": "product",
  "resourceId": "prod_123",
  "actor": {
    "userId": "user_456",
    "roles": ["admin"]
  },
  "before": { "name": "iPhone 14", "price": 999 },
  "after": { "name": "iPhone 14 Pro", "price": 1199 },
  "diff": [
    { "kind": "E", "path": ["name"], "lhs": "iPhone 14", "rhs": "iPhone 14 Pro" },
    { "kind": "E", "path": ["price"], "lhs": 999, "rhs": 1199 }
  ],
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "status": "success",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Hai cách ghi audit log:

#### Cách 1: HOF wrapper (cho admin CRUD operations)

```javascript
// Thay vì:
export const updateProduct = async (req, res) => { ... }

// Wrap bằng withAuditLog:
export const updateProduct = withAuditLog(updateProductHandler, {
  action: 'product.update',
  resource: 'product',
  getResourceId: (req) => req.params.id
})
```

**HOF tự động:**

1. Đọc snapshot "before" từ DB (trước khi handler chạy)
2. Chạy handler gốc
3. Đọc snapshot "after" từ DB (sau khi handler chạy)
4. Tính diff bằng `deep-diff`
5. Ghi audit log async (không block response)

#### Cách 2: Gọi trực tiếp (cho auth events)

```javascript
// Trong loginController:
await auditLogService.writeLog({
  action: 'user.login',
  resource: 'user',
  resourceId: user._id,
  actor: { userId: user._id, roles: user.roles },
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  status: 'success',
})
```

### Các events được audit log:

| Event                          | Trigger                       |
| ------------------------------ | ----------------------------- |
| `user.register`                | Đăng ký thành công            |
| `user.login`                   | Đăng nhập thành công          |
| `user.logout`                  | Đăng xuất                     |
| `user.login_failed`            | Đăng nhập thất bại            |
| `user.password_change`         | Đổi mật khẩu                  |
| `user.2fa_enable`              | Bật 2FA                       |
| `user.2fa_disable`             | Tắt 2FA                       |
| `session.revoke`               | Thu hồi 1 session             |
| `session.revoke_all`           | Thu hồi tất cả sessions       |
| `product.create/update/delete` | Admin CRUD sản phẩm           |
| `order.status_change`          | Admin đổi trạng thái đơn hàng |
| `user.role_change`             | Admin đổi role user           |
| `voucher.create/update/delete` | Admin CRUD voucher            |

### TTL — Tự động xóa sau 90 ngày

MongoDB TTL index trên field `timestamp` với `expireAfterSeconds: 7776000` (90 ngày). MongoDB tự động xóa documents cũ hơn 90 ngày — không cần cron job.

### Admin query API:

```
GET /admin/audit-logs?action=product.update&from=2025-01-01&to=2025-01-31&page=1&limit=20
GET /admin/audit-logs/:id  (xem chi tiết bao gồm before/after/diff)
```

Chỉ admin mới truy cập được (middleware `verifyAdmin`).

---

## Tổng kết: Mối quan hệ giữa các model

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  UserModel  │────►│   Session    │────►│  RefreshToken   │
│             │     │              │     │                 │
│ twoFactor   │     │ accessJti    │     │ jti (unique)    │
│ Enabled     │     │ refreshJti ──┼────►│ revokedAt       │
│ Secret      │     │ device, ip   │     │ rotatedFromJti  │
│ backupCodes │     │ isRevoked    │     │ expiresAt       │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                                          │
       │            ┌──────────────┐              │
       └───────────►│ LoginHistory │◄─────────────┘
                    │              │   (ghi mỗi lần login)
                    │ status       │
                    │ method       │
                    │ ip, device   │
                    └──────────────┘

                    ┌──────────────┐
                    │  AuditLog    │  (ghi mọi hành động quan trọng)
                    │              │
                    │ action       │
                    │ before/after │
                    │ diff         │
                    │ actor        │
                    │ TTL: 90 days │
                    └──────────────┘
```
