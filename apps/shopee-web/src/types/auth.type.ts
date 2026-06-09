import { SuccessResponseApi } from './utils.type'
import { User } from './user.type'

// Khi mà đăng nhập hoặc đăng ký thành công thì SuccessRes nó sẽ trả về cho AuthRes
export type AuthResponse = SuccessResponseApi<{
  access_token: string
  refresh_token: string
  expires_refresh_token: number
  expires: number
  user: User
}>

export type RefreshTokenResponse = SuccessResponseApi<{ access_token: string }>

/**
 * Login returns either a full token set or a 2FA partial result when
 * the account has 2FA enabled.
 */
export type LoginResponse = SuccessResponseApi<
  | {
      access_token: string
      refresh_token: string
      expires_refresh_token: number
      expires: number
      user: User
      requires2FA?: never
    }
  | {
      requires2FA: true
      partial_token: string
    }
>

/**
 * Response from POST auth/google/exchange-code
 * May be a full AuthResult (access+refresh tokens) or a 2FA partial result.
 */
export type GoogleExchangeCodeResponse = SuccessResponseApi<
  | {
      access_token: string
      refresh_token: string
      expires_refresh_token: number
      expires: number
      user: User
      requires2FA?: never
    }
  | {
      requires2FA: true
      partial_token: string
    }
>
