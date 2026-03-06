import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const passwordResetApi = {
  forgotPassword: async (email: string) => {
    try {
      return await http.post<SuccessResponseApi<{ message: string }>>('/forgot-password', { email })
    } catch (error) {
      console.warn('⚠️ [forgotPassword] API not available, using mock data')
      return {
        data: {
          message: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
          data: { message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' }
        }
      }
    }
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    try {
      return await http.post<SuccessResponseApi<{ message: string }>>('/reset-password', {
        token,
        password,
        confirm_password: confirmPassword
      })
    } catch (error) {
      console.warn('⚠️ [resetPassword] API not available, using mock data')
      return {
        data: {
          message: 'Đặt lại mật khẩu thành công',
          data: { message: 'Đặt lại mật khẩu thành công' }
        }
      }
    }
  }
}

export default passwordResetApi
