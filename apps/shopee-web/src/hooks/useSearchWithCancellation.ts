import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import productApi from 'src/apis/product.api'
import { ProductListConfig } from 'src/types/product.type'

export const useSearchWithCancellation = (queryConfig: ProductListConfig) => {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cancel previous request when query changes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [queryConfig.name]) // Cancel when search term changes

  const query = useQuery({
    queryKey: ['products', queryConfig],
    queryFn: ({ signal }) => {
      // Store abort controller for manual cancellation if needed
      abortControllerRef.current = new AbortController()

      return productApi.getProducts(queryConfig, {
        signal: signal || abortControllerRef.current.signal
      })
    },
    enabled: Boolean(queryConfig.name), // Only search when there's a query
    staleTime: 3 * 60 * 1000 // 3 minutes
  })

  // Manual cancel function
  const cancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    queryClient.cancelQueries({ queryKey: ['products', queryConfig] })
  }

  return {
    ...query,
    cancelSearch
  }
}

export default useSearchWithCancellation
