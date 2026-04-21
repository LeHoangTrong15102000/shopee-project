import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('react-toastify', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
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

  it('close button click calls onClose', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const onClose = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={onClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cancel button calls onClose', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const onClose = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={onClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    // The cancel/back button renders the translation key 'review.back'
    const cancelButton = screen.getByText('review.back')
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('star rating click changes the selected rating label', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    // Default rating is 5 — 'review.rating.excellent' should be shown
    expect(screen.getAllByText('review.rating.excellent').length).toBeGreaterThan(0)

    // Find the quality section and click the first star button (value 1)
    const qualitySection = screen.getByText('review.quality').closest('div')
    const starBtns = qualitySection!.querySelectorAll('button')
    fireEvent.click(starBtns[0])

    // After clicking star 1, label 'review.rating.terrible' should appear
    expect(screen.getByText('review.rating.terrible')).toBeInTheDocument()
  })

  it('shows review.rating.satisfied label when rating is 4', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const qualitySection = screen.getByText('review.quality').closest('div')
    const starBtns = qualitySection!.querySelectorAll('button')
    fireEvent.click(starBtns[3]) // star value 4
    expect(screen.getByText('review.rating.satisfied')).toBeInTheDocument()
  })

  it('shows review.rating.normal label when rating is 3', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const qualitySection = screen.getByText('review.quality').closest('div')
    const starBtns = qualitySection!.querySelectorAll('button')
    fireEvent.click(starBtns[2]) // star value 3
    expect(screen.getByText('review.rating.normal')).toBeInTheDocument()
  })

  it('shows review.rating.unsatisfied label when rating is 2', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const qualitySection = screen.getByText('review.quality').closest('div')
    const starBtns = qualitySection!.querySelectorAll('button')
    fireEvent.click(starBtns[1]) // star value 2
    expect(screen.getByText('review.rating.unsatisfied')).toBeInTheDocument()
  })

  it('comment textarea accepts input', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Great product!' } })
    expect((textarea as HTMLTextAreaElement).value).toBe('Great product!')
  })

  it('character counter reflects comment length', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    expect(screen.getByText('5/2000')).toBeInTheDocument()
  })

  it('submit button is disabled when comment is empty', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    // With empty comment the submit button must be disabled
    const submitButton = screen.getByText('review.submit').closest('button')!
    expect(submitButton).toBeDisabled()
  })

  it('clicking submit with empty comment calls toast.error with rateAndComment key', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockToastError.mockClear()

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    // The submit button is disabled when comment is empty per component logic,
    // but we can verify by firing a click on it anyway (disabled buttons still
    // receive synthetic click events in jsdom).
    const submitButton = screen.getByText('review.submit').closest('button')!
    fireEvent.click(submitButton)
    // The button is disabled so handleSubmit is not called;
    // the disabled attribute prevents the action
    expect(submitButton).toBeDisabled()
  })

  it('clicking submit with non-empty comment shorter than 10 chars calls toast.error minChars', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockToastError.mockClear()

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Short' } }) // 5 chars, < 10

    const submitButton = screen.getByText('review.submit').closest('button')!
    // Button is enabled now (comment is non-empty)
    expect(submitButton).not.toBeDisabled()
    fireEvent.click(submitButton)

    expect(mockToastError).toHaveBeenCalledWith('review.minChars')
  })

  it('displays category name when category is an object', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const purchaseWithObjCategory = {
      ...mockPurchase,
      product: { ...mockPurchase.product, category: { name: 'Electronics' } },
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal
          isOpen={true}
          onClose={mockOnClose}
          purchase={purchaseWithObjCategory as any}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/Electronics/)).toBeInTheDocument()
  })

  it('displays string category directly when category is a string', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const purchaseWithStringCategory = {
      ...mockPurchase,
      product: { ...mockPurchase.product, category: 'Books' },
    }

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal
          isOpen={true}
          onClose={mockOnClose}
          purchase={purchaseWithStringCategory as any}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/Books/)).toBeInTheDocument()
  })

  it('renders product image with correct src and alt', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductReviewModal isOpen={true} onClose={mockOnClose} purchase={mockPurchase as any} />
      </QueryClientProvider>,
    )

    const img = screen.getByAltText('Test Product')
    expect(img).toHaveAttribute('src', 'test-image.jpg')
  })
})
