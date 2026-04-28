import http from '@/utils/http'
import axios from 'axios'
import { AuthResponse, RefreshTokenResponse } from '@/types/auth.type'
import { User } from '@/types/user.type'
import { URL_LOGIN, URL_REGISTER, URL_LOGOUT, URL_REFRESH_TOKEN } from './auth.constants'

const mockUser: User = {
  _id: 'mock-user-id',
  roles: ['User'],
  email: 'user@shopee.vn',
  name: 'Nguyễn Văn A',
  date_of_birth: '1990-01-15T00:00:00.000Z',
  avatar: 'https://picsum.photos/seed/avatar/200',
  address: 'Quận 1, Hồ Chí Minh',
  phone: '0901234567',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
}

const authApi = {
  loginAccount: async (body: { email: string; password: string }) => {
    try {
      return await http.post<AuthResponse>(URL_LOGIN, body)
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('⚠️ [loginAccount] API not available, using mock data')
        return {
          data: {
            message: 'Đăng nhập thành công',
            data: {
              access_token: 'mock-access-token-' + Date.now(),
              refresh_token: 'mock-refresh-token-' + Date.now(),
              expires_refresh_token: Date.now() + 604800000,
              expires: Date.now() + 86400000,
              user: { ...mockUser, email: body.email },
            },
          },
        }
      }
      throw error
    }
  },

  registerAccount: async (body: { email: string; password: string }) => {
    try {
      return await http.post<AuthResponse>(URL_REGISTER, body)
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('⚠️ [registerAccount] API not available, using mock data')
        return {
          data: {
            message: 'Đăng ký thành công',
            data: {
              access_token: 'mock-access-token-' + Date.now(),
              refresh_token: 'mock-refresh-token-' + Date.now(),
              expires_refresh_token: Date.now() + 604800000,
              expires: Date.now() + 86400000,
              user: { ...mockUser, email: body.email },
            },
          },
        }
      }
      throw error
    }
  },

  logoutAccount: async () => {
    try {
      return await http.post(URL_LOGOUT)
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('⚠️ [logoutAccount] API not available, using mock data')
        return { data: { message: 'Đăng xuất thành công' } }
      }
      throw error
    }
  },

  refreshAccessToken: async (body: { refresh_token: string }) => {
    try {
      return await http.post<RefreshTokenResponse>(URL_REFRESH_TOKEN, body)
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('⚠️ [refreshAccessToken] API not available, using mock data')
        return {
          data: {
            message: 'Refresh token thành công',
            data: { access_token: 'mock-access-token-refreshed-' + Date.now() },
          },
        }
      }
      throw error
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await http.post('auth/forgot-password', { email })
  },
}

export default authApi
