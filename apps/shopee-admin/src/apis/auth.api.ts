import http, { getRefreshTokenFromLS } from 'src/utils/http'
import type { SuccessResponse, User } from 'src/types'

interface LoginBody {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

const authApi = {
  login: (body: LoginBody) => http.post<SuccessResponse<LoginResponse>>('login', body),
  logout: () =>
    // Send the refresh token so the server can revoke it in the DB.
    // Content-Type: application/json is set by the Axios instance default.
    http.post('logout', { refresh_token: getRefreshTokenFromLS() }),
  forgotPassword: (email: string) =>
    http.post<SuccessResponse<{ message: string }>>('auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    http.post<SuccessResponse<{ message: string }>>('auth/reset-password', { token, password }),
}

export default authApi
