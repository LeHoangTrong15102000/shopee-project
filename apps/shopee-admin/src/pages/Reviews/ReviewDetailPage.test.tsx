import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ReviewDetailPage from './ReviewDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'review-1' }) }
})

describe('ReviewDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<ReviewDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders review content after loading', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.review')).toBeInTheDocument()
    expect(screen.getByText('detail.product')).toBeInTheDocument()
  })

  it('renders page header with title', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders moderation actions', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /actions.approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actions.flag/i })).toBeInTheDocument()
  })

  it('renders review comment text', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.review')).toBeInTheDocument()
    const reviewCard = document.querySelector('[class*="card"]')
    expect(reviewCard).toBeInTheDocument()
  })

  it('renders product info section', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.product')).toBeInTheDocument()
    const productCard = screen.getByText('detail.product').closest('[class*="card"]')
    expect(productCard).toBeInTheDocument()
  })

  it('renders review rating', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText(/\/5/)).toBeInTheDocument()
    })
  })

  it('renders back navigation button', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('renders review comment text from mock data', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm rất tốt, giao hàng nhanh')).toBeInTheDocument()
    })
  })

  it('renders product name in detail', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    })
  })

  it('renders user info section', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.user')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })
  })

  it('clicks approve button', async () => {
    const { toast } = await import('sonner')
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    const approveBtn = screen.getByRole('button', { name: /actions.approve/i })
    await user.click(approveBtn)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('renders review with comments', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: 'https://example.com/iphone.jpg',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt, giao hàng nhanh',
            images: [],
            comments: [
              {
                _id: 'comment-1',
                user: { _id: 'user-2', name: 'Admin', email: 'admin@shopee.com' },
                content: 'Cảm ơn bạn đã đánh giá!',
                createdAt: '2024-01-02T00:00:00.000Z',
              },
            ],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Cảm ơn bạn đã đánh giá!')).toBeInTheDocument()
    })
  })

  it('clicks approve button and shows toast', async () => {
    const { toast } = await import('sonner')
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    const approveBtn = screen.getByRole('button', { name: /actions.approve/i })
    await user.click(approveBtn)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('clicks flag button and shows toast', async () => {
    const { toast } = await import('sonner')
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    const flagBtn = screen.getByRole('button', { name: /actions.flag/i })
    await user.click(flagBtn)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('navigates back to /reviews when back button clicked', async () => {
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/reviews')
  })

  it('renders review images when present', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: 'https://example.com/iphone.jpg',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt',
            images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
            comments: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByAltText('Review image 1')).toBeInTheDocument()
      expect(screen.getByAltText('Review image 2')).toBeInTheDocument()
    })
  })

  it('opens delete comment dialog and confirms deletion', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: 'https://example.com/iphone.jpg',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt',
            images: [],
            comments: [
              {
                _id: 'comment-1',
                user: { _id: 'user-2', name: 'Admin', email: 'admin@shopee.com' },
                content: 'Cảm ơn bạn đã đánh giá!',
                createdAt: '2024-01-02T00:00:00.000Z',
              },
            ],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Cảm ơn bạn đã đánh giá!')).toBeInTheDocument()
    })
    const deleteBtn = screen.getByLabelText(/aria.deleteItem/i)
    await user.click(deleteBtn)
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('toast.deleteCommentTitle')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('renders product image when available', async () => {
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByAltText('iPhone 15')).toBeInTheDocument()
    })
  })

  it('closes delete comment dialog via cancel button (onOpenChange false branch)', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: 'https://example.com/iphone.jpg',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt',
            images: [],
            comments: [
              {
                _id: 'comment-1',
                user: { _id: 'user-2', name: 'Admin', email: 'admin@shopee.com' },
                content: 'Cảm ơn bạn đã đánh giá!',
                createdAt: '2024-01-02T00:00:00.000Z',
              },
            ],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Cảm ơn bạn đã đánh giá!')).toBeInTheDocument()
    })
    const deleteBtn = screen.getByLabelText(/aria.deleteItem/i)
    await user.click(deleteBtn)
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    // Click cancel to trigger onOpenChange(false) -> setDeleteCommentId(null)
    await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('renders notAvailable when user has no name', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: '', email: 'noname@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: 'https://example.com/iphone.jpg',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt',
            images: [],
            comments: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('states.notAvailable')).toBeInTheDocument()
    })
  })

  it('renders product section without image when image is empty', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'review-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            product: {
              _id: 'product-1',
              name: 'iPhone 15',
              image: '',
            },
            rating: 5,
            comment: 'Sản phẩm rất tốt',
            images: [],
            comments: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<ReviewDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    })
    // No product image should be rendered when image is empty
    expect(screen.queryByAltText('iPhone 15')).not.toBeInTheDocument()
  })
})
