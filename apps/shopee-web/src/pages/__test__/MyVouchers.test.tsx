import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import MyVouchers from '../User/pages/MyVouchers/MyVouchers'

// Uses global react-i18next mock from vitest.setup.js

vi.mock('src/apis/voucher.api', () => ({
  default: {
    getMyVouchers: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            vouchers: [],
          },
        },
      }),
    ),
    applyVoucher: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    )
}

describe('MyVouchers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders my vouchers page', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(MyVouchers), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Voucher của tôi')).toBeInTheDocument()
    })
  })

  it('displays voucher category tabs', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(MyVouchers), { wrapper: Wrapper })

    await waitFor(() => {
      const allButtons = screen.getAllByText('Tất cả')
      expect(allButtons.length).toBeGreaterThan(0)
      expect(screen.getByText('Voucher Shop')).toBeInTheDocument()
      expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument()
      expect(screen.getByText('Shopee')).toBeInTheDocument()
    })
  })

  it('displays voucher status tabs', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(MyVouchers), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Có thể sử dụng')).toBeInTheDocument()
      expect(screen.getByText('Đã sử dụng')).toBeInTheDocument()
      expect(screen.getByText('Hết hạn')).toBeInTheDocument()
    })
  })

  it('shows empty state when no vouchers', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(MyVouchers), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Chưa có voucher nào')).toBeInTheDocument()
    })
  })
})
