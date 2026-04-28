import { useQuery } from '@tanstack/react-query'
import { getShop } from '@/apis/shop.api'

export function useShop(id: string) {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => getShop(id),
    enabled: !!id,
  })
}
