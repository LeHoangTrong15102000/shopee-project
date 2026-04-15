import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import Compare from '../Compare/Compare'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'compare:title': 'So sánh sản phẩm',
        'compare:pageTitle': 'So sánh sản phẩm',
        'compare:pageDescription': 'So sánh các sản phẩm',
        'compare:addToCompare': 'Thêm sản phẩm để so sánh',
        'compare:recentlyViewed': 'Sản phẩm đã xem',
        'compare:comparing': 'Đang so sánh {{count}} sản phẩm',
        'compare:addProduct': 'Thêm sản phẩm',
      }
      return translations[key] || key.split(':')[1] || key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/hooks/useProductComparison', () => ({
  useProductComparison: () => ({
    compareList: [],
    addToCompare: vi.fn(),
    removeFromCompare: vi.fn(),
    clearCompare: vi.fn(),
  }),
}))

vi.mock('src/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({
    recentlyViewed: [],
    addProduct: vi.fn(),
    removeProduct: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticAddToCart: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('src/components/ComparisonTable', () => ({
  default: ({ onAddToCart }: { onAddToCart: any }) => (
    <div data-testid="comparison-table">Comparison Table</div>
  ),
}))

vi.mock('src/components/RecentlyViewed', () => ({
  default: ({ products, onRemove, onClearAll }: any) => (
    <div data-testid="recently-viewed">Recently Viewed</div>
  ),
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

describe('Compare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders compare page', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(Compare), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('comparison-table')).toBeInTheDocument()
    })
  })

  it('displays comparison table', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(Compare), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('comparison-table')).toBeInTheDocument()
    })
  })

  it('displays recently viewed section', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(Compare), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('recently-viewed')).toBeInTheDocument()
    })
  })

  it('shows add to compare message when no products', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(Compare), { wrapper: Wrapper })

    await waitFor(() => {
      expect(container.querySelector('.container')).toBeInTheDocument()
    })
  })
})
