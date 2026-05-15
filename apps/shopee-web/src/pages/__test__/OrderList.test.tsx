import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import OrderList from '../User/pages/OrderList/OrderList'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'order:tabs.all': 'Tất cả',
        'order:tabs.pending': 'Chờ xác nhận',
        'order:tabs.confirmed': 'Đã xác nhận',
        'order:tabs.shipping': 'Đang giao',
        'order:tabs.delivered': 'Đã giao',
        'order:tabs.cancelled': 'Đã hủy',
        'order:tabs.returned': 'Trả hàng',
        'order:empty': 'Chưa có đơn hàng nào',
      }
      return translations[key] || key.split(':')[1] || key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/apis/order.api', () => ({
  default: {
    getOrders: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            orders: [],
            pagination: {
              page: 1,
              limit: 10,
              totalPages: 1,
              totalItems: 0,
            },
          },
        },
      }),
    ),
    cancelOrder: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}))

vi.mock('src/hooks/nuqs/orderSearchParams', () => ({
  useOrderStatus: () => [0, vi.fn()],
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
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

describe('OrderList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders order list page', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(OrderList), { wrapper: Wrapper })

    await waitFor(() => {
      const tabs = container.querySelectorAll('button')
      expect(tabs.length).toBeGreaterThan(0)
    })
  })

  it('displays all order tabs', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(OrderList), { wrapper: Wrapper })

    await waitFor(() => {
      const tabs = container.querySelectorAll('button')
      expect(tabs.length).toBeGreaterThanOrEqual(6)
    })
  })

  it('shows empty state when no orders', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(OrderList), { wrapper: Wrapper })

    await waitFor(() => {
      const emptyIcon = container.querySelector('.text-6xl')
      expect(emptyIcon).toBeInTheDocument()
    })
  })
})
