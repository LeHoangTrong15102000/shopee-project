import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { reorderItems } from '@/apis/order.api'
import { toast } from '@/utils/toast'

export function useReorder() {
  const router = useRouter()

  return useMutation({
    mutationFn: (orderId: string) => reorderItems(orderId),
    onSuccess: (result) => {
      if (result.skippedItems.length > 0) {
        const skippedNames = result.skippedItems.join(', ')
        toast.warning(
          `Đã thêm ${result.addedCount} sản phẩm vào giỏ hàng`,
          `Không thể thêm: ${skippedNames}`
        )
      } else {
        toast.success(`Đã thêm ${result.addedCount} sản phẩm vào giỏ hàng`)
      }
      router.push('/(tabs)/cart')
    },
    onError: () => {
      toast.error('Không thể mua lại', 'Vui lòng thử lại sau')
    },
  })
}
