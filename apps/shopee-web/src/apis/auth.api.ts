import { AuthResponse, RefreshTokenResponse } from 'src/types/auth.type'
import { User } from 'src/types/user.type'
import http from 'src/utils/http'

export const URL_LOGIN = 'login'
export const URL_REGISTER = 'register'
export const URL_LOGOUT = 'logout'
export const URL_REFRESH_TOKEN = 'refresh-access-token'

const mockUser: User = {
  _id: 'mock-user-id',
  roles: ['User'] as ('User' | 'Admin')[],
  email: 'user@shopee.vn',
  name: 'Nguyễn Văn A',
  date_of_birth: '1990-01-15T00:00:00.000Z',
  avatar: 'https://picsum.photos/seed/avatar/200',
  address: 'Quận 1, Hồ Chí Minh',
  phone: '0901234567',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
}

const authApi = {
  registerAccount: async (body: { email: string; password: string }) => {
    try {
      return await http.post<AuthResponse>(URL_REGISTER, body)
    } catch (error) {
      console.warn('⚠️ [registerAccount] API not available, using mock data')
      const mockAccessToken = 'mock-access-token-' + Date.now()
      const mockRefreshToken = 'mock-refresh-token-' + Date.now()
      return {
        data: {
          message: 'Đăng ký thành công',
          data: {
            access_token: mockAccessToken,
            refresh_token: mockRefreshToken,
            expires_refresh_token: Date.now() + 604800000,
            expires: Date.now() + 86400000,
            user: { ...mockUser, email: body.email }
          }
        }
      }
    }
  },

  loginAccount: async (body: { email: string; password: string }) => {
    try {
      return await http.post<AuthResponse>(URL_LOGIN, body)
    } catch (error) {
      console.warn('⚠️ [loginAccount] API not available, using mock data')
      const mockAccessToken = 'mock-access-token-' + Date.now()
      const mockRefreshToken = 'mock-refresh-token-' + Date.now()
      return {
        data: {
          message: 'Đăng nhập thành công',
          data: {
            access_token: mockAccessToken,
            refresh_token: mockRefreshToken,
            expires_refresh_token: Date.now() + 604800000,
            expires: Date.now() + 86400000,
            user: { ...mockUser, email: body.email }
          }
        }
      }
    }
  },

  logoutAccount: async () => {
    try {
      return await http.post(URL_LOGOUT)
    } catch (error) {
      console.warn('⚠️ [logoutAccount] API not available, using mock data')
      return {
        data: {
          message: 'Đăng xuất thành công'
        }
      }
    }
  },

  // Body phải gửi lên đúng là object có `refresh_token`, cái ở đây để cho biết là phải truyền lên một cái object có một thuộc tính là refresh_token(chỉ là params thôi) -> Nhưng mà cũng phải ghi giống với BE quy định
  refreshAccessToken: async (body: { refresh_token: string }) => {
    try {
      return await http.post<RefreshTokenResponse>(URL_REFRESH_TOKEN, body)
    } catch (error) {
      console.warn('⚠️ [refreshAccessToken] API not available, using mock data')
      return {
        data: {
          message: 'Refresh token thành công',
          data: {
            access_token: 'mock-access-token-refreshed-' + Date.now()
          }
        }
      }
    }
  }
}

// export const registerAccount = (body: { email: string; password: string }) => http.post<AuthResponse>('/register', body)

// export const loginAccount = (body: { email: string; password: string }) => http.post<AuthResponse>('/login', body)

// export const logoutAccount = () => http.post('/logout')

/**
 * Muốn custom thời gian cho access_token và refresh_token thì truyền lên header 2 tham số
 * + `expire_access_token` và `expires_refresh_token`
 */

export default authApi
