import http from '@/utils/http'
import { AuthResponse, RefreshTokenResponse } from '@/types/auth.type'
import { URL_LOGIN, URL_REGISTER, URL_LOGOUT, URL_REFRESH_TOKEN } from './auth.constants'

const authApi = {
  loginAccount: (body: { email: string; password: string }) =>
    http.post<AuthResponse>(URL_LOGIN, body),

  registerAccount: (body: { email: string; password: string }) =>
    http.post<AuthResponse>(URL_REGISTER, body),

  logoutAccount: () => http.post(URL_LOGOUT),

  refreshAccessToken: (body: { refresh_token: string }) =>
    http.post<RefreshTokenResponse>(URL_REFRESH_TOKEN, body),

  forgotPassword: async (email: string): Promise<void> => {
    await http.post('auth/forgot-password', { email })
  },
}

export default authApi
