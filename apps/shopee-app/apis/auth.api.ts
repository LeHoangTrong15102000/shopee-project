import http from '@/utils/http'
import { AuthResponse, RefreshTokenResponse } from '@/types/auth.type'
import { URL_LOGIN, URL_REGISTER, URL_LOGOUT, URL_REFRESH_TOKEN } from './auth.constants'
import { useAuthStore } from '@/store/authStore'

const authApi = {
  loginAccount: (body: { email: string; password: string }) =>
    http.post<AuthResponse>(URL_LOGIN, body),

  registerAccount: (body: { email: string; password: string }) =>
    http.post<AuthResponse>(URL_REGISTER, body),

  logoutAccount: () => {
    // Send the refresh token so the server can revoke it in the DB.
    // Content-Type: application/json is set by the Axios instance default.
    const refresh_token = useAuthStore.getState().refreshToken
    return http.post(URL_LOGOUT, { refresh_token })
  },

  refreshAccessToken: (body: { refresh_token: string }) =>
    http.post<RefreshTokenResponse>(URL_REFRESH_TOKEN, body),

  forgotPassword: async (email: string): Promise<void> => {
    await http.post('auth/forgot-password', { email })
  },

  googleLogin: (body: { id_token: string }) => http.post<AuthResponse>('auth/google', body),
}

export default authApi
