# shopee-api

Express + MongoDB REST API for the Shopee project.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. The server will exit immediately at startup and print a list of all missing/invalid variables if any required env var is misconfigured.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `PORT` | No | `4000` | HTTP port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `SECRET_KEY_JWT` | **Yes** | — | JWT signing secret. **Must be ≥ 32 characters.** Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_ACCESS_TTL` | No | `900` | Access token TTL in seconds (default: 15 minutes) |
| `JWT_REFRESH_TTL` | No | `2592000` | Refresh token TTL in seconds (default: 30 days) |
| `CLIENT_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `UPLOAD_DIR` | No | `upload` | File upload directory |
| `AUTH_STRICT_MODE` | No | `false` | When `true`, legacy tokens (without `jti`/`roles`) are rejected. See rollout section. |

## Auth Architecture

### Token Strategy

- **Access tokens**: Short-lived JWTs signed with `SECRET_KEY_JWT`. Stateless — not stored in DB. Default TTL: 15 minutes.
- **Refresh tokens**: JWTs stored in the `refresh_tokens` MongoDB collection. Default TTL: 30 days.

### JWT Payload Shape

Access and refresh tokens include the following claims:

```json
{
  "id": "<userId>",
  "email": "user@example.com",
  "roles": ["User"],
  "created_at": "2024-01-01T00:00:00.000Z",
  "jti": "<uuid>",
  "iat": 1234567890,
  "exp": 1234568790
}
```

The `jti` (JWT ID) claim is unique per token and is used for refresh token rotation and reuse detection.

### Refresh Token Rotation

Every call to `POST /refresh-access-token` issues a **new** access + refresh token pair and marks the old refresh token as revoked (`revokedAt`). The previous refresh token can no longer be used.

**Reuse detection**: If a refresh token that has already been rotated (its `revokedAt` is set) is sent again, the server treats this as a token theft signal. It immediately revokes **all** refresh tokens for that user, forcing a full re-login on all devices.

### `verifyAdmin` — DB-free happy path

The `verifyAdmin` middleware reads `roles` from the JWT payload instead of querying the database on every request. This reduces admin endpoint latency.

- If `roles.includes('Admin')`: proceeds without a DB call.
- If `roles` is empty (legacy token without roles): falls back to a DB lookup and logs a deprecation warning. This backward-compatible path will be removed when `AUTH_STRICT_MODE=true`.
- Route-level opt-in for fresh DB check: apply `authMiddleware.requireFreshRoleCheck` before `authMiddleware.verifyAdmin` on role-sensitive endpoints.

## Rollout Checklist (harden-auth-security)

1. Deploy with `AUTH_STRICT_MODE=false` (default).
2. Monitor `auth.refresh.rotation`, `auth.refresh.reuse_detected`, and `auth.admin.db_fallback` metrics in logs for 1 week.
3. If no spike in 401s or unexpected `reuse_detected` events, flip `AUTH_STRICT_MODE=true`.
4. After 2 weeks stable: remove legacy fallback code paths (legacy token with empty `roles` array).

## Security Hardening

The following security measures are implemented:

### Password Security
- **Strong password requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **Enhanced hashing**: PBKDF2 with 13 rounds (8192 iterations) for password storage
- **Secure password reset**: Time-limited tokens (1 hour expiry) with automatic cleanup

### Authentication Security
- **Short-lived access tokens**: 15-minute expiry reduces exposure window
- **Refresh token rotation**: New token pair issued on each refresh, old token revoked
- **Reuse detection**: Automatic revocation of all user tokens on suspected token theft
- **JWT ID tracking**: Unique `jti` claim per token for rotation and reuse detection

### Rate Limiting & Brute Force Protection
- **Account lockout**: 5 failed login attempts trigger 15-minute lockout
- **Rate limiting**: Applied to login, register, password reset, and token refresh endpoints
- **IP + email tracking**: Prevents bypass by changing email or IP alone

### Input Validation
- **Email normalization**: Lowercase and trimmed before processing
- **Strong password validation**: Enforced on registration and password reset
- **Suspicious pattern detection**: SQL injection, XSS, path traversal, and command injection patterns blocked

### Security Headers
- **Helmet.js**: Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- **HTTPS enforcement**: Automatic redirect in production
- **CORS whitelist**: Only allowed origins can access the API

### Error Message Security
- **No user enumeration**: Login errors don't reveal if email exists
- **Password reset safety**: Same response whether email exists or not
- **Generic error messages**: Avoid leaking implementation details

### Additional Protections
- **Request size limits**: Prevents DoS attacks via large payloads
- **Content-type validation**: Only allowed content types accepted
- **Suspicious activity logging**: Security events logged for monitoring
- **Token invalidation**: All tokens revoked on password reset

## Development

```bash
npm run dev      # Start in watch mode
npm run test:api # Run all tests
npm run build    # Compile TypeScript
```
