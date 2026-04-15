import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProductReviewModal from '../ProductReviewModal/ProductReviewModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('src/apis/review.api', () => ({
  default: {
    createReview: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}))

describe('ProductReviewModal', () => {
  const mockPurchase = {
    _id: 'purchase-1',
    product: {
      _id: 'product-1',
      name: 'Test Product',
      image: 'test-image.jpg',
      category: { name: 'Test Category' },
    },
    buy_count: 1,
    price: 100000,
    price_before_discount: 150000,
  }

  const mockOnClose = vi.fn()

  it('renders modal when open', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('review.heading')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={false} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays product information', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('displays rating stars', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('review.quality')).toBeInTheDocument()
  })
})
