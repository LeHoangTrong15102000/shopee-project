import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/apis/product.api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}
