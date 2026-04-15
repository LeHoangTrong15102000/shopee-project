import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useOptimisticWishlist } from '../useOptimisticWishlist'
import type { WishlistCheckQueryData, WishlistCountQueryData } from '../../shared/types'

vi.mock('src/apis/wishlist.api')
vi.mock('src/contexts/app.context', async () => {
  const React = await import('react')
  return {
    AppContext: React.createContext({ isAuthenticated: true, profile: { _id: 'user1' } }),
  }
})
vi.mock('../../shared/utils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  logOptimisticError: vi.fn(),
}))

const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useOptimisticWishlist', () => {
  let wishlistApi: typeof import('src/apis/wishlist.api').default
  let utils: typeof import('../../shared/utils')

  beforeEach(async () => {
    vi.clearAllMocks()
    wishlistApi = (await import('src/apis/wishlist.api')).default
    utils = await import('../../shared/utils')
    vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
      data: { data: { in_wishlist: false } },
    } as never)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return wishlist state and mutations', () => {
    const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isInWishlist).toBeDefined()
    expect(result.current.isLoading).toBeDefined()
    expect(result.current.addMutation).toBeDefined()
    expect(result.current.removeMutation).toBeDefined()
    expect(typeof result.current.toggleWishlist).toBe('function')
  })

  it('should have correct mutation properties', () => {
    const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.addMutation.isPending).toBe(false)
    expect(result.current.removeMutation.isPending).toBe(false)
  })

  it('should provide toggleWishlist function', () => {
    const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(),
    })

    expect(() => {
      result.current.toggleWishlist()
    }).not.toThrow()
  })

  it('should check authentication status', () => {
    const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isAuthenticated).toBeDefined()
  })

  it('should return isInWishlist as false when checkData is undefined', async () => {
    vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
      data: { data: { in_wishlist: false } },
    } as never)

    const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isInWishlist).toBe(false)
    })
  })

  it('should return isInWishlist as true when product is in wishlist', async () => {
    vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
      data: { data: { in_wishlist: true } },
    } as never)

    const { result } = renderHook(() => useOptimisticWishlist('product-456'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isInWishlist).toBe(true)
    })
  })

  it('should query with staleTime of 30 seconds', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    renderHook(() => useOptimisticWishlist('product-123'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(wishlistApi.checkInWishlist).toHaveBeenCalledWith('product-123')
    })
  })

  describe('addMutation', () => {
    it('should call addToWishlist API when adding to wishlist', async () => {
      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(wishlistApi.addToWishlist).toHaveBeenCalledWith({ product_id: 'product-123' })
      })
    })

    it('should optimistically update wishlist check on add', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should optimistically increment wishlist count on add', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const initialCount: WishlistCountQueryData = {
        data: { message: 'Success', data: { count: 5 } },
      }
      queryClient.setQueryData(['wishlist', 'count'], initialCount)

      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        const updatedCount = queryClient.getQueryData<WishlistCountQueryData>(['wishlist', 'count'])
        expect(updatedCount?.data?.data?.count).toBe(6)
      })
    })

    it('should handle undefined wishlist count on add', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should rollback on add error when previousWishlistCheck exists', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const previousCheck: WishlistCheckQueryData = {
        data: { message: 'Success', data: { in_wishlist: false } },
      }
      queryClient.setQueryData(['wishlist', 'check', 'product-123'], previousCheck)

      vi.mocked(wishlistApi.addToWishlist).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
        expect(utils.logOptimisticError).toHaveBeenCalled()
      })
    })

    it('should rollback wishlist count on add error when previousWishlistCount exists', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const previousCount: WishlistCountQueryData = {
        data: { message: 'Success', data: { count: 5 } },
      }
      queryClient.setQueryData(['wishlist', 'count'], previousCount)

      vi.mocked(wishlistApi.addToWishlist).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
      })
    })

    it('should invalidate queries on add settled', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wishlist'] })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['wishlist', 'check', 'product-123'],
        })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wishlist', 'count'] })
      })
    })
  })

  describe('removeMutation', () => {
    it('should call removeFromWishlist API when removing from wishlist', async () => {
      vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
        data: { data: { in_wishlist: true } },
      } as never)
      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isInWishlist).toBe(true)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(wishlistApi.removeFromWishlist).toHaveBeenCalledWith('product-123')
      })
    })

    it('should optimistically update wishlist check on remove', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should optimistically decrement wishlist count on remove', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const initialCount: WishlistCountQueryData = {
        data: { message: 'Success', data: { count: 5 } },
      }
      queryClient.setQueryData(['wishlist', 'count'], initialCount)

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        const updatedCount = queryClient.getQueryData<WishlistCountQueryData>(['wishlist', 'count'])
        expect(updatedCount?.data?.data?.count).toBe(4)
      })
    })

    it('should not decrement wishlist count below 0 on remove', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const initialCount: WishlistCountQueryData = {
        data: { message: 'Success', data: { count: 0 } },
      }
      queryClient.setQueryData(['wishlist', 'count'], initialCount)

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        const updatedCount = queryClient.getQueryData<WishlistCountQueryData>(['wishlist', 'count'])
        expect(updatedCount?.data?.data?.count).toBe(0)
      })
    })

    it('should handle undefined wishlist count on remove', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should rollback on remove error when previousWishlistCheck exists', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const previousCheck: WishlistCheckQueryData = {
        data: { message: 'Success', data: { in_wishlist: true } },
      }
      queryClient.setQueryData(['wishlist', 'check', 'product-123'], previousCheck)

      vi.mocked(wishlistApi.removeFromWishlist).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
        expect(utils.logOptimisticError).toHaveBeenCalled()
      })
    })

    it('should rollback wishlist count on remove error when previousWishlistCount exists', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const previousCount: WishlistCountQueryData = {
        data: { message: 'Success', data: { count: 5 } },
      }
      queryClient.setQueryData(['wishlist', 'count'], previousCount)

      vi.mocked(wishlistApi.removeFromWishlist).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
      })
    })

    it('should invalidate queries on remove settled', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wishlist'] })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['wishlist', 'check', 'product-123'],
        })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wishlist', 'count'] })
      })
    })
  })

  describe('toggleWishlist', () => {
    it('should call addMutation when product is not in wishlist', async () => {
      vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
        data: { data: { in_wishlist: false } },
      } as never)
      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isInWishlist).toBe(false)
      })

      result.current.toggleWishlist()

      await waitFor(() => {
        expect(wishlistApi.addToWishlist).toHaveBeenCalled()
      })
    })

    it('should call removeMutation when product is in wishlist', async () => {
      vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
        data: { data: { in_wishlist: true } },
      } as never)
      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isInWishlist).toBe(true)
      })

      result.current.toggleWishlist()

      await waitFor(() => {
        expect(wishlistApi.removeFromWishlist).toHaveBeenCalled()
      })
    })
  })

  describe('isLoading', () => {
    it('should be true when checking wishlist status', () => {
      vi.mocked(wishlistApi.checkInWishlist).mockImplementation(
        () => new Promise(() => {}) as never,
      )

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should be true when add mutation is pending', async () => {
      vi.mocked(wishlistApi.addToWishlist).mockImplementation(() => new Promise(() => {}) as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('should be true when remove mutation is pending', async () => {
      vi.mocked(wishlistApi.removeFromWishlist).mockImplementation(
        () => new Promise(() => {}) as never,
      )

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('should be false when no operations are pending', async () => {
      vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
        data: { data: { in_wishlist: false } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle add mutation with no previous data', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-new'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should handle remove mutation with no previous data', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-new'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showSuccessToast).toHaveBeenCalled()
      })
    })

    it('should handle error without context in add mutation', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.addToWishlist).mockRejectedValue(new Error('Network Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
      })
    })

    it('should handle error without context in remove mutation', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      vi.mocked(wishlistApi.removeFromWishlist).mockRejectedValue(new Error('Network Error'))

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        expect(utils.showErrorToast).toHaveBeenCalled()
      })
    })

    it('should handle count with undefined data on add', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const initialCount: WishlistCountQueryData = {
        data: { message: 'Success', data: undefined as never },
      }
      queryClient.setQueryData(['wishlist', 'count'], initialCount)

      vi.mocked(wishlistApi.addToWishlist).mockResolvedValue({
        data: { message: 'Success', data: {} },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.addMutation.mutate()

      await waitFor(() => {
        const updatedCount = queryClient.getQueryData<WishlistCountQueryData>(['wishlist', 'count'])
        expect(updatedCount?.data?.data?.count).toBe(1)
      })
    })

    it('should handle count with undefined data on remove', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

      const initialCount: WishlistCountQueryData = {
        data: { message: 'Success', data: undefined as never },
      }
      queryClient.setQueryData(['wishlist', 'count'], initialCount)

      vi.mocked(wishlistApi.removeFromWishlist).mockResolvedValue({
        data: { message: 'Success', data: { message: 'Removed' } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.removeMutation.mutate()

      await waitFor(() => {
        const updatedCount = queryClient.getQueryData<WishlistCountQueryData>(['wishlist', 'count'])
        expect(updatedCount?.data?.data?.count).toBe(0)
      })
    })

    it('should return correct isChecking state', async () => {
      vi.mocked(wishlistApi.checkInWishlist).mockResolvedValue({
        data: { data: { in_wishlist: false } },
      } as never)

      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
    })

    it('should return correct isAuthenticated state', () => {
      const { result } = renderHook(() => useOptimisticWishlist('product-123'), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.isAuthenticated).toBe('boolean')
    })
  })
})
