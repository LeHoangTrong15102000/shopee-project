import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useVoucherSave from '../useVoucherSave'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    i18n: { language: 'en' },
  })),
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('src/apis/voucher.api', () => ({
  default: {
    getAvailableVouchers: vi.fn(() =>
      Promise.resolve({
        data: { data: { vouchers: [] } },
      }),
    ),
    saveVoucher: vi.fn(() => Promise.resolve()),
  },
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useVoucherSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useVoucherSave(), { wrapper })

    expect(result.current).toHaveProperty('vouchers')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('savedIds')
    expect(result.current).toHaveProperty('savingIds')
    expect(result.current).toHaveProperty('handleSave')
    expect(Array.isArray(result.current.vouchers)).toBe(true)
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.isError).toBe('boolean')
    expect(typeof result.current.refetch).toBe('function')
    expect(result.current.savedIds instanceof Set).toBe(true)
    expect(result.current.savingIds instanceof Set).toBe(true)
    expect(typeof result.current.handleSave).toBe('function')
  })

  it('should handle enabled false', () => {
    const { result } = renderHook(() => useVoucherSave({ enabled: false }), { wrapper })

    expect(result.current.vouchers).toEqual([])
  })
})
