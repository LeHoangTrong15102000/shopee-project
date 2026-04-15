import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import {
  useDashboardOverview,
  useDashboardRevenue,
  useDashboardOrderTrend,
  useDashboardUserGrowth,
  useDashboardTopProducts,
  useDashboardTopBuyers,
  useDashboardRevenueByCategory,
} from './useDashboard'

describe('useDashboardOverview', () => {
  it('fetches dashboard overview', async () => {
    const { result } = renderHook(() => useDashboardOverview(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total_revenue).toBeDefined()
    expect(result.current.data?.total_orders).toBeDefined()
  })
})

describe('useDashboardRevenue', () => {
  it('fetches revenue data with period', async () => {
    const { result } = renderHook(() => useDashboardRevenue('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('fetches revenue data with 30d period', async () => {
    const { result } = renderHook(() => useDashboardRevenue('30d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('handles custom period with date range', async () => {
    const { result } = renderHook(
      () => useDashboardRevenue('custom', { start_date: '2024-01-01', end_date: '2024-01-31' }),
      { wrapper: createQueryWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('is disabled for custom period without date range', () => {
    const { result } = renderHook(() => useDashboardRevenue('custom'), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDashboardOrderTrend', () => {
  it('fetches order trends', async () => {
    const { result } = renderHook(() => useDashboardOrderTrend('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('is disabled for custom period', () => {
    const { result } = renderHook(() => useDashboardOrderTrend('custom'), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDashboardUserGrowth', () => {
  it('fetches user growth', async () => {
    const { result } = renderHook(() => useDashboardUserGrowth('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useDashboardTopProducts', () => {
  it('fetches top products', async () => {
    const { result } = renderHook(() => useDashboardTopProducts('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useDashboardTopBuyers', () => {
  it('fetches top buyers', async () => {
    const { result } = renderHook(() => useDashboardTopBuyers('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useDashboardRevenueByCategory', () => {
  it('fetches revenue by category', async () => {
    const { result } = renderHook(() => useDashboardRevenueByCategory('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
