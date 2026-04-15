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
