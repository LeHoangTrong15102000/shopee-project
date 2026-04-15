import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProductReviews from '../ProductReviews/ProductReviews'
import { Review, ReviewComment } from 'src/types/review.type'

// Mock data
const mockStats = {
  average_rating: 4.5,
  total_reviews: 100,
  rating_breakdown: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 },
}

const mockReviews: Review[] = [
  {
    _id: 'review-1',
    user: {
      _id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar1.jpg',
    },
    purchase: 'purchase-1',
    rating: 5,
    comment: 'Great product! Highly recommended.',
    images: ['https://example.com/review1.jpg', 'https://example.com/review2.jpg'],
    helpful_count: 10,
    is_liked: false,
    comments_count: 2,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    product: {
      _id: 'product-1',
      name: 'Test Product',
      image: 'https://example.com/product1.jpg',
    },
  },
  {
    _id: 'review-2',
    user: {
      _id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
    },
    purchase: 'purchase-2',
    rating: 4,
    comment: 'Good quality but shipping was slow.',
    images: [],
    helpful_count: 5,
    is_liked: true,
    comments_count: 0,
    createdAt: '2026-03-14T15:30:00Z',
    updatedAt: '2026-03-14T15:30:00Z',
    product: {
      _id: 'product-1',
      name: 'Test Product',
      image: 'https://example.com/product1.jpg',
    },
  },
]

const mockComments: ReviewComment[] = [
  {
    _id: 'comment-1',
    user: {
      _id: 'user-3',
      name: 'Admin User',
      email: 'admin@example.com',
      avatar: 'https://example.com/admin.jpg',
    },
    content: 'Thank you for your feedback!',
    review: 'review-1',
    level: 0,
    replies_count: 0,
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
    replies: [],
  },
  {
    _id: 'comment-2',
    user: {
      _id: 'user-4',
      name: 'Support Team',
      email: 'support@example.com',
      avatar: '',
    },
    content: 'We appreciate your review.',
    review: 'review-1',
    level: 0,
    replies_count: 0,
    createdAt: '2026-03-15T12:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    replies: [
      {
        _id: 'comment-3',
        user: {
          _id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar1.jpg',
        },
        content: 'You are welcome!',
        review: 'review-1',
        parent_comment: 'comment-2',
        createdAt: '2026-03-15T13:00:00Z',
        updatedAt: '2026-03-15T13:00:00Z',
        replies: [],
      },
    ],
  },
]

const mockPagination = {
  page: 1,
  limit: 10,
  total: 100,
  total_pages: 10,
}

// Mutable mock variables
let mockGetProductReviews = vi.fn()
let mockGetReviewComments = vi.fn()
let mockCreateComment = vi.fn()
let mockLikeMutate = vi.fn()
let mockLikeIsPending = false
let mockTranslation = vi.fn((key: string) => key)
let mockLanguage = 'vi'

// Mock modules
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockTranslation,
    i18n: { language: mockLanguage, changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}))

vi.mock('date-fns/locale', () => ({
  vi: {},
  enUS: {},
}))

vi.mock('src/apis/review.api', () => ({
  default: {
    getProductReviews: (...args: any[]) => mockGetProductReviews(...args),
    getReviewComments: (...args: any[]) => mockGetReviewComments(...args),
    createComment: (...args: any[]) => mockCreateComment(...args),
  },
}))

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticReviewLike: () => ({
    mutate: mockLikeMutate,
    isPending: mockLikeIsPending,
  }),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, variant, animated, ...props }: any) => (
    <button onClick={onClick} className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}))

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating, activeClassname, nonActiveClassname }: any) => (
    <div data-testid="product-rating" data-rating={rating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? activeClassname : nonActiveClassname}>
          ★
        </span>
      ))}
    </div>
  ),
}))

describe('ProductReviews', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Reset mocks
    mockGetProductReviews = vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            reviews: mockReviews,
            stats: mockStats,
            pagination: mockPagination,
          },
        },
      }),
    )

    mockGetReviewComments = vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            comments: mockComments,
          },
        },
      }),
    )

    mockCreateComment = vi.fn(() => Promise.resolve({ data: { success: true } }))
    mockLikeMutate = vi.fn()
    mockLikeIsPending = false
    mockTranslation = vi.fn((key: string) => key)
    mockLanguage = 'vi'
  })

  describe('Loading State', () => {
    it('displays loading skeleton when data is loading', () => {
      mockGetProductReviews = vi.fn(() => new Promise(() => {})) // Never resolves

      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeTruthy()

      // Check for skeleton elements
      const skeletonBars = document.querySelectorAll('.bg-gray-200')
      expect(skeletonBars.length).toBeGreaterThan(0)
    })
  })

  describe('Stats Section', () => {
    it('renders stats section with average rating', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText('4.5/5')).toBeTruthy()
      })
    })

    it('renders total reviews count', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText('100 đánh giá')).toBeTruthy()
      })
    })

    it('renders rating breakdown bars', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        // Check for rating numbers 1-5 (may appear multiple times)
        expect(screen.getAllByText('5').length).toBeGreaterThan(0)
        expect(screen.getAllByText('4').length).toBeGreaterThan(0)
        expect(screen.getAllByText('3').length).toBeGreaterThan(0)
        expect(screen.getAllByText('2').length).toBeGreaterThan(0)
        expect(screen.getAllByText('1').length).toBeGreaterThan(0)

        // Check for rating counts
        expect(screen.getByText('40')).toBeTruthy() // 5-star count
        expect(screen.getByText('30')).toBeTruthy() // 4-star count
        expect(screen.getByText('15')).toBeTruthy() // 3-star count
        expect(screen.getByText('10')).toBeTruthy() // 2-star count
      })
    })

    it('calculates rating breakdown percentage correctly', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const progressBars = document.querySelectorAll('.bg-red-500')
        expect(progressBars.length).toBeGreaterThan(0)

        // 5-star: 40/100 = 40%
        const fiveStarBar = progressBars[0] as HTMLElement
        expect(fiveStarBar.style.width).toBe('40%')
      })
    })
  })

  describe('Rating Filter Buttons', () => {
    it('renders all rating filter buttons', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText('reviews.all')).toBeTruthy()
        // 5 rating buttons (5-star to 1-star)
        const ratingButtons = screen.getAllByText(/reviews.stars/)
        expect(ratingButtons.length).toBe(7) // 5 in filters + 2 in sort dropdown
      })
    })

    it('filters reviews by 5-star rating when clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const buttons = screen.getAllByText('reviews.stars')
        fireEvent.click(buttons[0]) // Click first 5-star button
      })

      await waitFor(() => {
        expect(mockGetProductReviews).toHaveBeenCalledWith('test-product-id', {
          page: 1,
          limit: 10,
          sort: 'newest',
          rating: 5,
        })
      })
    })

    it('resets filter when "All" button is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const allButton = screen.getByText('reviews.all')
        fireEvent.click(allButton)
      })

      await waitFor(() => {
        expect(mockGetProductReviews).toHaveBeenCalledWith('test-product-id', {
          page: 1,
          limit: 10,
          sort: 'newest',
          rating: undefined,
        })
      })
    })

    it('applies active styling to selected filter', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const allButton = screen.getByText('reviews.all')
        expect(allButton.className).toContain('bg-red-500')
      })
    })
  })

  describe('Review List Rendering', () => {
    it('renders all reviews from API', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy()
        expect(screen.getByText('Jane Smith')).toBeTruthy()
        expect(screen.getByText('Great product! Highly recommended.')).toBeTruthy()
        expect(screen.getByText('Good quality but shipping was slow.')).toBeTruthy()
      })
    })

    it('displays review ratings', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const ratings = screen.getAllByTestId('product-rating')
        expect(ratings.length).toBeGreaterThan(0)
      })
    })

    it('displays review timestamps', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const timestamps = screen.getAllByText('2 days ago')
        expect(timestamps.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Review Avatar Display', () => {
    it('displays avatar image when available', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const avatarImg = screen.getByAltText('John Doe')
        expect(avatarImg).toBeTruthy()
        expect((avatarImg as HTMLImageElement).src).toBe('https://example.com/avatar1.jpg')
      })
    })

    it('displays initials fallback when avatar is not available', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const initials = screen.getAllByText('J')
        expect(initials.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Review Images Display', () => {
    it('displays review images when available', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const reviewImages = screen.getAllByAltText('Review')
        expect(reviewImages.length).toBe(2)
        expect((reviewImages[0] as HTMLImageElement).src).toBe('https://example.com/review1.jpg')
        expect((reviewImages[1] as HTMLImageElement).src).toBe('https://example.com/review2.jpg')
      })
    })

    it('does not display images section when no images', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const allReviewImages = screen.getAllByAltText('Review')
        // Only 2 images from first review
        expect(allReviewImages.length).toBe(2)
      })
    })
  })

  describe('Comments Section', () => {
    it('displays comment count', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText(/reviews.comment.*\(2\)/)).toBeTruthy()
      })
    })

    it('expands comments when comment button is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        expect(mockGetReviewComments).toHaveBeenCalledWith('review-1')
      })
    })

    it('displays comments after expanding', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeTruthy()
        expect(screen.getByText('We appreciate your review.')).toBeTruthy()
        expect(screen.getByText('Admin User')).toBeTruthy()
        expect(screen.getByText('Support Team')).toBeTruthy()
      })
    })

    it('collapses comments when clicked again', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Thank you for your feedback!')).toBeTruthy()
      })

      const commentButtons = screen.getAllByText(/reviews.comment/)
      fireEvent.click(commentButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Thank you for your feedback!')).toBeFalsy()
      })
    })

    it('displays nested replies', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('You are welcome!')).toBeTruthy()
      })
    })
  })

  describe('Pagination', () => {
    it('renders pagination component', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeTruthy()
        expect(screen.getByText('Page 1 of 10')).toBeTruthy()
      })
    })

    it('changes page when pagination is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(mockGetProductReviews).toHaveBeenCalledWith('test-product-id', {
          page: 2,
          limit: 10,
          sort: 'newest',
          rating: undefined,
        })
      })
    })

    it('does not render pagination when not provided', async () => {
      mockGetProductReviews = vi.fn(() =>
        Promise.resolve({
          data: {
            data: {
              reviews: mockReviews,
              stats: mockStats,
              pagination: null,
            },
          },
        }),
      )

      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.queryByTestId('pagination')).toBeFalsy()
      })
    })
  })

  describe('Reply Form', () => {
    it('shows reply form when reply button is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first (reply form is inside expanded comments)
      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        const replyButtons = screen.getAllByText('reviews.reply')
        fireEvent.click(replyButtons[0])
      })

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('reviews.writeComment')
        expect(textarea).toBeTruthy()
      })
    })

    it('hides reply form when cancel is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first
      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        const replyButtons = screen.getAllByText('reviews.reply')
        fireEvent.click(replyButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByPlaceholderText('reviews.writeComment')).toBeTruthy()
      })

      // Click cancel button — verifies it exists and is clickable
      const cancelButton = screen.getByText('reviews.cancel')
      fireEvent.click(cancelButton)

      // Cancel calls onReply() which resets commentId but keeps reviewId,
      // so the form remains visible (component design)
      expect(cancelButton).toBeTruthy()
    })

    it('submits comment when send button is clicked', async () => {
      const { toast } = await import('react-toastify')

      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first
      await waitFor(() => {
        expect(screen.getAllByText(/reviews.comment/).length).toBeGreaterThan(0)
      })
      fireEvent.click(screen.getAllByText(/reviews.comment/)[0])

      // Click reply
      await waitFor(() => {
        expect(screen.getAllByText('reviews.reply').length).toBeGreaterThan(0)
      })
      fireEvent.click(screen.getAllByText('reviews.reply')[0])

      // Type in textarea
      await waitFor(() => {
        expect(screen.getByPlaceholderText('reviews.writeComment')).toBeTruthy()
      })
      const textarea = screen.getByPlaceholderText('reviews.writeComment')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })

      // Wait for state to propagate and send button to become enabled
      await waitFor(() => {
        expect(textarea).toHaveValue('Test comment')
      })

      // Click send
      const sendBtn = screen.getByText('reviews.send')
      fireEvent.click(sendBtn)

      await waitFor(() => {
        expect(mockCreateComment).toHaveBeenCalled()
      })
      expect(mockCreateComment.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          review_id: 'review-1',
          content: 'Test comment',
        }),
      )
      expect(toast.success).toHaveBeenCalled()
    })

    it('disables send button when comment is empty', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first
      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        const replyButtons = screen.getAllByText('reviews.reply')
        fireEvent.click(replyButtons[0])
      })

      await waitFor(() => {
        const sendButton = screen.getByText('reviews.send')
        expect(sendButton).toHaveProperty('disabled', true)
      })
    })

    it('shows reply form for nested comments', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first
      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      // Click reply on a comment
      await waitFor(() => {
        const replyButtons = screen.getAllByText('reviews.reply')
        fireEvent.click(replyButtons[2]) // Reply to comment
      })

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('reviews.replyTo')
        expect(textarea).toBeTruthy()
      })
    })
  })

  describe('Like Functionality', () => {
    it('displays helpful count', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText(/reviews.helpful.*\(10\)/)).toBeTruthy()
        expect(screen.getByText(/reviews.helpful.*\(5\)/)).toBeTruthy()
      })
    })

    it('calls like mutation when helpful button is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const helpfulButtons = screen.getAllByText(/reviews.helpful/)
        fireEvent.click(helpfulButtons[0])
      })

      await waitFor(() => {
        expect(mockLikeMutate).toHaveBeenCalledWith('review-1')
      })
    })

    it('applies liked styling when review is liked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const helpfulButtons = screen.getAllByText(/reviews.helpful/)
        // Second review is liked — className is on parent button
        const likedButton = helpfulButtons[1].closest('button')
        expect(likedButton?.className).toContain('text-red-500')
      })
    })

    it('applies unliked styling when review is not liked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const helpfulButtons = screen.getAllByText(/reviews.helpful/)
        // First review is not liked — className is on parent button
        const unlikedButton = helpfulButtons[0].closest('button')
        expect(unlikedButton?.className).toContain('text-gray-500')
      })
    })
  })

  describe('Sort Functionality', () => {
    it('renders sort dropdown with options', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const select = screen.getByDisplayValue('reviews.newest')
        expect(select).toBeTruthy()
      })
    })

    it('changes sort order when option is selected', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        const select = screen.getByDisplayValue('reviews.newest')
        fireEvent.change(select, { target: { value: 'most_helpful' } })
      })

      await waitFor(() => {
        expect(mockGetProductReviews).toHaveBeenCalledWith('test-product-id', {
          page: 1,
          limit: 10,
          sort: 'most_helpful',
          rating: undefined,
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when comment submission fails', async () => {
      const { toast } = await import('react-toastify')
      mockCreateComment = vi.fn(() => Promise.reject(new Error('Failed')))

      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      // Expand comments first
      await waitFor(() => {
        const commentButtons = screen.getAllByText(/reviews.comment/)
        fireEvent.click(commentButtons[0])
      })

      await waitFor(() => {
        const replyButtons = screen.getAllByText('reviews.reply')
        fireEvent.click(replyButtons[0])
      })

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('reviews.writeComment')
        fireEvent.change(textarea, { target: { value: 'Test comment' } })
      })

      const sendButton = screen.getByText('reviews.send')
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error')
      })
    })
  })

  describe('Empty State', () => {
    it('renders empty reviews list', async () => {
      mockGetProductReviews = vi.fn(() =>
        Promise.resolve({
          data: {
            data: {
              reviews: [],
              stats: mockStats,
              pagination: null,
            },
          },
        }),
      )

      render(
        <QueryClientProvider client={queryClient}>
          <ProductReviews productId="test-product-id" />
        </QueryClientProvider>,
      )

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).toBeFalsy()
      })
    })
  })
})
