import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShopMetrics from '../ShopMetrics'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/apis/shop.api', () => ({
  default: {
    getShop: vi.fn(() =>
      Promise.resolve({
        data: { data: null },
      }),
    ),
  },
}))

vi.mock('src/utils/utils', () => ({
  formatNumberToSocialStyle: (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  },
  formatCurrency: (n: number) => n.toLocaleString('vi-VN'),
  rateSale: (original: number, sale: number) =>
    -Math.round(((original - sale) / original) * 100),
  generateNameId: (name: string, id: string) => `${name}-i.${id}`,
  getIdFromNameId: (nameId: string) => nameId.split('-i.').at(-1) ?? '',
  isAxiosError: (error: unknown) => false,
  isAxiosUnprocessableEntityError: (error: unknown) => false,
  removeSpecialCharacter: (str: string) => str.replace(/[^a-zA-Z0-9\s]/g, ''),
  setToLS: vi.fn(),
  getFromLS: vi.fn(() => null),
  removeFromLS: vi.fn(),
  EventTargetLike: vi.fn(),
}))

describe('ShopMetrics', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const renderComponent = (rating: number, shopId?: string) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ShopMetrics rating={rating} shopId={shopId} />
      </QueryClientProvider>,
    )

  it('renders shop statistics section', () => {
    renderComponent(4.5)
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  it('renders rating with one decimal place', () => {
    renderComponent(4.5)
    expect(screen.getByText('4.5/5.0')).toBeInTheDocument()
  })

  it('renders fallback dash when no shopId is provided for responseRate', () => {
    renderComponent(4.2)
    // Without shopId, response rate shows "—" fallback
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders all label keys', () => {
    renderComponent(4.0)
    expect(screen.getByText(/shop\.ratings/)).toBeInTheDocument()
    expect(screen.getByText(/shop\.responseRate/)).toBeInTheDocument()
    expect(screen.getByText(/shop\.products/)).toBeInTheDocument()
    expect(screen.getByText(/shop\.responseTime/)).toBeInTheDocument()
    expect(screen.getByText(/shop\.joined/)).toBeInTheDocument()
    expect(screen.getByText(/shop\.followers/)).toBeInTheDocument()
  })

  it('shows withinHours fallback for responseTime when no shopId', () => {
    renderComponent(4.0)
    // When no shopId, responseTime falls back to t('shop.withinHours') which mocked returns 'shop.withinHours'
    expect(screen.getByText('shop.withinHours')).toBeInTheDocument()
  })

  it('renders with different rating values', () => {
    const { rerender } = renderComponent(3.0)
    expect(screen.getByText('3.0/5.0')).toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <ShopMetrics rating={5.0} />
      </QueryClientProvider>,
    )
    expect(screen.getByText('5.0/5.0')).toBeInTheDocument()
  })

  it('renders grid with 2 columns', () => {
    const { container } = renderComponent(4.5)
    const grid = container.querySelector('.grid.grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('renders exactly 6 metric rows', () => {
    const { container } = renderComponent(4.5)
    const rows = container.querySelectorAll('.flex.items-center.gap-2.text-sm')
    expect(rows.length).toBe(6)
  })

  it('shows dash fallbacks for all dynamic metrics when no shopId', () => {
    renderComponent(4.0)
    // responseRate, productCount, joined, followers all show "—"
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })
})
