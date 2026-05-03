import { ApiResponse } from './api.type'
import { User } from './user.type'

export type AuthResponse = ApiResponse<{
  access_token: string
  refresh_token: string
  expires_refresh_token: number
  expires: number
  user: User
}>

export type RefreshTokenResponse = ApiResponse<{ access_token: string }>
