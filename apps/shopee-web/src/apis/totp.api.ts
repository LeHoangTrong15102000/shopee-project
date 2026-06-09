import http, { setInMemoryTokens } from 'src/utils/http'
import { SuccessResponseApi } from 'src/types/utils.type'
import { setAccessTokenToLS, setRefreshTokenToLS } from 'src/utils/auth'

export interface TotpSetupResponse {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface TotpCompleteResponse {
  access_token: string
  refresh_token: string
  expires: number
  expires_refresh_token: number
}

export interface BackupCodesResponse {
  backup_codes: string[]
}

const totpApi = {
  /** POST /auth/2fa/setup — initiates TOTP setup, returns QR, secret, backup codes */
  setup: () => http.post<SuccessResponseApi<TotpSetupResponse>>('auth/2fa/setup'),

  /** POST /auth/2fa/verify-setup — confirms setup with 6-digit code; enables 2FA */
  verifySetup: (body: { code: string }) =>
    http.post<SuccessResponseApi<{ message: string }>>('auth/2fa/verify-setup', body),

  /** POST /auth/2fa/disable — disables 2FA using TOTP or backup code */
  disable: (body: { code: string }) =>
    http.post<SuccessResponseApi<{ message: string }>>('auth/2fa/disable', body),

  /** POST /auth/2fa/backup-codes — regenerates backup codes using TOTP code */
  backupCodes: (body: { code: string }) =>
    http.post<SuccessResponseApi<BackupCodesResponse>>('auth/2fa/backup-codes', body),

  /**
   * POST /auth/2fa/complete — finalises 2FA login.
   * Returns only the token set (no user).  Caller must persist tokens and then
   * fetch GET /me to obtain the user profile.
   */
  complete: (body: { partial_token: string; code: string }) =>
    http.post<SuccessResponseApi<TotpCompleteResponse>>('auth/2fa/complete', body),
}

/**
 * Persists the token pair returned by /auth/2fa/complete into localStorage so
 * the HTTP client and refresh-token flow work on the next request.
 * Called by TwoFactorVerify before fetching /me.
 */
export function persistTotpTokens(data: TotpCompleteResponse) {
  setAccessTokenToLS(data.access_token)
  setRefreshTokenToLS(data.refresh_token)
  // Sync the Http singleton's in-memory fields so the Axios request interceptor
  // sends the Authorization header on the immediately-following GET /me request.
  setInMemoryTokens(data.access_token, data.refresh_token)
}

export default totpApi
