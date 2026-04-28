import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import OrderDetailPage from './OrderDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'order-1' }) }
})

describe('OrderDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<OrderDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders order content after loading', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.items')).toBeInTheDocument()
    expect(screen.getByText('detail.status')).toBeInTheDocument()
  })

  it('renders page header with back button', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders customer info section', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.customer')).toBeInTheDocument()
  })

  it('renders customer name from mock data', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    })
  })

  it('renders customer email from mock data', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })
  })

  it('renders product name in order items table', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
  })

  it('renders order items table with correct columns', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.product')).toBeInTheDocument()
    expect(screen.getByText('detail.price')).toBeInTheDocument()
    expect(screen.getByText('detail.qty')).toBeInTheDocument()
    expect(screen.getByText('detail.subtotal')).toBeInTheDocument()
  })

  it('renders order total price', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText(/detail\.total/)).toBeInTheDocument()
  })

  it('renders status select dropdown', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText('detail.updateStatus')).toBeInTheDocument()
  })

  it('renders status timeline with all statuses', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('status.pending')).toBeInTheDocument()
      expect(screen.getByText('status.processing')).toBeInTheDocument()
      expect(screen.getByText('status.shipped')).toBeInTheDocument()
      expect(screen.getByText('status.delivered')).toBeInTheDocument()
      expect(screen.getByText('status.cancelled')).toBeInTheDocument()
    })
  })

  it('renders info card with date', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.info')).toBeInTheDocument()
    expect(screen.getByText('detail.date')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument()
    })
  })

  it('renders payment method in info card', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.payment')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('COD')).toBeInTheDocument()
    })
  })

  it('renders shipping address in info card', async () => {
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.address')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('123 Nguyễn Huệ, Q1, TP.HCM')).toBeInTheDocument()
    })
  })

  it('navigates back to /orders when back button clicked', async () => {
    const { user } = renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/orders')
  })

  it('opens status select to change order status', async () => {
    const { user } = renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    const statusSelect = screen.getByLabelText('detail.updateStatus')
    await user.click(statusSelect)
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
  })

  it('renders no payment or address when not present', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'order-1',
            user: { _id: 'user-1', name: 'Nguyễn Văn A', email: 'user@example.com' },
            items: [
              {
                product: { _id: 'prod-1', name: 'iPhone 15' },
                buy_count: 1,
                price: 29990000,
                price_before_discount: 34990000,
              },
            ],
            total_price: 29990000,
            status: 'pending',
            payment_method: '',
            shipping_address: '',
            note: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    })
    expect(screen.queryByText('detail.payment')).not.toBeInTheDocument()
    expect(screen.queryByText('detail.address')).not.toBeInTheDocument()
  })

  it('renders order with string user (non-object)', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'order-1',
            user: 'user-1',
            items: [
              {
                product: 'prod-1',
                buy_count: 2,
                price: 15000000,
                price_before_discount: 18000000,
              },
            ],
            total_price: 30000000,
            status: 'processing',
            payment_method: 'COD',
            shipping_address: '123 Test St',
            note: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('prod-1')).toBeInTheDocument()
    })
    // Customer card should not render when user is a string
    expect(screen.queryByText('detail.customer')).not.toBeInTheDocument()
  })

  it('renders customer without name showing N/A fallback', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders/:id`, () => {
        return HttpResponse.json({
          data: {
            _id: 'order-1',
            user: { _id: 'user-1', name: '', email: 'user@example.com' },
            items: [
              {
                product: { _id: 'prod-1', name: 'iPhone 15' },
                buy_count: 1,
                price: 29990000,
                price_before_discount: 34990000,
              },
            ],
            total_price: 29990000,
            status: 'pending',
            payment_method: 'COD',
            shipping_address: '123 Test St',
            note: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<OrderDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('states.notAvailable')).toBeInTheDocument()
    })
  })
})
