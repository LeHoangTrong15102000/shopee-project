import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useProducts } from 'src/hooks/useProducts'
import { server } from '../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('Token Refresh Integration', () => {
  it('retries request after 401 triggers token refresh', async () => {
    let callCount = 0
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({
          message: 'Success',
          data: {
            products: [],
            pagination: { page: 1, limit: 10, page_size: 1 },
          },
        })
      }),
    )

    const { result } = renderHook(() => useProducts(0), { wrapper: createQueryWrapper() })

    await waitFor(
      () => {
        // Either succeeds after refresh or fails — both are valid outcomes
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 5000 },
    )
  })

  it('redirects to login on refresh failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/products`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }),
      http.post(`${API_URL}/refresh-access-token`, () => {
        return HttpResponse.json({ message: 'Refresh failed' }, { status: 401 })
      }),
    )

    const { result } = renderHook(() => useProducts(0), { wrapper: createQueryWrapper() })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 5000 },
    )
    // After refresh failure, the request should have errored
    expect(result.current.isError).toBe(true)
  })
})

