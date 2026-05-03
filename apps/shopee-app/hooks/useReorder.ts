import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { getOrderItems } from '@/apis/order.api'
import { addMultipleToCart } from '@/apis/cart.api'
import { toast } from '@/utils/toast'

export function useReorder() {
  const { t } = useTranslation()
  const router = useRouter()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const items = await getOrderItems(orderId)
      return addMultipleToCart(items)
    },
    onSuccess: (result) => {
      if (result.skippedItems.length > 0) {
        const skippedNames = result.skippedItems.join(', ')
        toast.warning(
          t('reorder.toast.partialSuccess', { count: result.addedCount }),
          t('reorder.toast.skipped', { names: skippedNames })
        )
      } else {
        toast.success(t('reorder.toast.success', { count: result.addedCount }))
      }
      router.push('/(tabs)/cart')
    },
    onError: () => {
      toast.error(t('reorder.toast.error'), t('errors.genericMessage'))
    },
  })
}
