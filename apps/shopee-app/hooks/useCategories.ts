import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/apis/product.api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes — categories are essentially static
  })
}
