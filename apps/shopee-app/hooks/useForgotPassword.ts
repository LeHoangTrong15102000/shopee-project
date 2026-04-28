import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { toast } from '@/utils/toast'

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onError: () => {
      // Generic error — do not reveal whether the email exists
      toast.error('Có lỗi xảy ra', 'Vui lòng thử lại sau')
    },
  })
}
