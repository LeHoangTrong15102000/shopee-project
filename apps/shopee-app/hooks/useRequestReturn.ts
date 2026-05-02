import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { requestReturn, type ReturnPayload } from '@/apis/order.api'
import { toast } from '@/utils/toast'
import { orderKeys } from '@/hooks/useOrders'
import { handleMutationError } from '@/utils/mutationErrorHandler'

export function useRequestReturn() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ReturnPayload }) =>
      requestReturn(orderId, payload),
    onSuccess: (_data, variables) => {
      toast.success(t('requestReturn.toast.success'))
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.all() })
      router.back()
    },
    onError: handleMutationError,
  })
}
