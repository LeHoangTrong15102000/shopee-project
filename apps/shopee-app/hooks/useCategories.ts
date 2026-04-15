import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/services/product.api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}
