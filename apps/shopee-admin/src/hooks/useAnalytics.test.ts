import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import {
  useTopSelling,
  useTopViewed,
  useTopRated,
  useStatsByCategory,
  useChatbotOverview,
  useChatbotPerformance,
} from './useAnalytics'

describe('useTopSelling', () => {
  it('fetches top selling products', async () => {
    const { result } = renderHook(() => useTopSelling('7d'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useTopViewed', () => {
  it('fetches top viewed products', async () => {
    const { result } = renderHook(() => useTopViewed(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useTopRated', () => {
  it('fetches top rated products', async () => {
    const { result } = renderHook(() => useTopRated(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useStatsByCategory', () => {
  it('fetches stats by category', async () => {
    const { result } = renderHook(() => useStatsByCategory(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useChatbotOverview', () => {
  it('fetches chatbot overview', async () => {
    const { result } = renderHook(() => useChatbotOverview(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useChatbotPerformance', () => {
  it('fetches chatbot performance data', async () => {
    const { result } = renderHook(() => useChatbotPerformance('7d'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
