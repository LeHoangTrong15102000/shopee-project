import http from 'src/utils/http'
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
  logout: () => http.post('logout'),
  forgotPassword: (email: string) =>
    http.post<SuccessResponse<{ message: string }>>('auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    http.post<SuccessResponse<{ message: string }>>('auth/reset-password', { token, password }),
}

export default authApi
