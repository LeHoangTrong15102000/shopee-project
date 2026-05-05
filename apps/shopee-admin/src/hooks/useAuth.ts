import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import authApi from 'src/apis/auth.api'

export function useForgotPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success(i18n.t('forgotPassword.successMessage', { ns: 'login' }))
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('forgotPassword.errorMessage', { ns: 'login' }))
    },
  })
}

export function useResetPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success(i18n.t('resetPassword.successMessage', { ns: 'login' }))
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('resetPassword.errorMessage', { ns: 'login' }))
    },
  })
}
