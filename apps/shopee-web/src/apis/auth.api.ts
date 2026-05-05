import { AuthResponse, RefreshTokenResponse } from 'src/types/auth.type'
import http from 'src/utils/http'

export const URL_LOGIN = 'login'
export const URL_REGISTER = 'register'
export const URL_LOGOUT = 'logout'
export const URL_REFRESH_TOKEN = 'refresh-access-token'

const authApi = {
  registerAccount: (body: { email: string; password: string }) => {
    return http.post<AuthResponse>(URL_REGISTER, body)
  },

  loginAccount: (body: { email: string; password: string }) => {
    return http.post<AuthResponse>(URL_LOGIN, body)
  },

  logoutAccount: () => {
    return http.post(URL_LOGOUT)
  },

  // Body phải gửi lên đúng là object có `refresh_token`, cái ở đây để cho biết là phải truyền lên một cái object có một thuộc tính là refresh_token(chỉ là params thôi) -> Nhưng mà cũng phải ghi giống với BE quy định
  refreshAccessToken: (body: { refresh_token: string }) => {
    return http.post<RefreshTokenResponse>(URL_REFRESH_TOKEN, body)
  },
}

// Test ci-cd-pipeline

export default authApi
