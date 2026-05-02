import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import authApi from '@/apis/auth.api'
import { toast } from '@/utils/toast'

export function useForgotPassword() {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onError: () => {
      // Generic error — do not reveal whether the email exists
      toast.error(t('errors.genericTitle'), t('errors.genericMessage'))
    },
  })
}
