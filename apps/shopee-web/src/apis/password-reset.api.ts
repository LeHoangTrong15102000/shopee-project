import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const passwordResetApi = {
  forgotPassword: (email: string) => {
    return http.post<SuccessResponseApi<{ message: string }>>('/forgot-password', { email })
  },

  resetPassword: (token: string, password: string, confirmPassword: string) => {
    return http.post<SuccessResponseApi<{ message: string }>>('/reset-password', {
      token,
      password,
      confirm_password: confirmPassword,
    })
  },
}

export default passwordResetApi
