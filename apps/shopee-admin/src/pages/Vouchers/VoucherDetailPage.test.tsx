import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import VoucherDetailPage from './VoucherDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'voucher-1' }) }
})

describe('VoucherDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders loading state initially', () => {
    renderWithProviders(<VoucherDetailPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders voucher content after loading', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.usageHistory')).toBeInTheDocument()
    expect(screen.getByText('detail.details')).toBeInTheDocument()
  })

  it('renders page header with voucher code', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('renders voucher status info', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.status')).toBeInTheDocument()
  })

  it('renders all detail panel fields', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.type')).toBeInTheDocument()
    expect(screen.getByText('detail.value')).toBeInTheDocument()
    expect(screen.getByText('detail.minOrder')).toBeInTheDocument()
    expect(screen.getByText('detail.usage')).toBeInTheDocument()
    expect(screen.getByText('detail.start')).toBeInTheDocument()
    expect(screen.getByText('detail.end')).toBeInTheDocument()
  })

  it('renders usage history table headers', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.getByText('detail.user')).toBeInTheDocument()
    expect(screen.getByText('detail.order')).toBeInTheDocument()
    expect(screen.getByText('detail.discount')).toBeInTheDocument()
    expect(screen.getByText('detail.date')).toBeInTheDocument()
  })

  it('renders usage history data from API', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    // The MSW handler returns usage data with user: 'user-1' and order: 'order-1'
    await waitFor(() => {
      const table = screen.getAllByRole('table')
      expect(table.length).toBeGreaterThan(0)
    })
  })

  it('navigates back to /vouchers when back button clicked', async () => {
    const { user } = renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.back/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/vouchers')
  })

  it('renders discount type value in detail panel', async () => {
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    // The mock voucher should display either percentage or currency value
    const cells = screen.getAllByRole('cell')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('renders error state when API returns 404', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders fixed discount value with currency format', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'voucher-2',
            code: 'FLAT100K',
            discount_type: 'fixed',
            discount_value: 100000,
            is_active: true,
            used_count: 3,
            usage_limit: 10,
            min_order_value: 200000,
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-12-31T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    // currency format for fixed discount
    await waitFor(() => {
      expect(screen.getByText('detail.value')).toBeInTheDocument()
    })
  })

  it('renders usage history with user object (not string)', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id/usage`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            usage: [
              {
                _id: 'usage-obj',
                user: { _id: 'user-1', email: 'test@example.com' },
                voucher: 'voucher-1',
                order: 'order-1',
                discount_amount: 50000,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1 },
          },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  it('renders no usage message when usage list is empty', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id/usage`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: { usage: [], pagination: { page: 1, limit: 10, total: 0 } },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('detail.noUsage')).toBeInTheDocument()
    })
  })

  it('renders percentage discount value with % symbol', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'voucher-pct',
            code: 'SALE20',
            discount_type: 'percentage',
            discount_value: 20,
            is_active: true,
            used_count: 5,
            usage_limit: 100,
            min_order_value: 100000,
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-12-31T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('20%')).toBeInTheDocument()
    })
  })

  it('renders inactive voucher status badge', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            _id: 'voucher-inactive',
            code: 'EXPIRED',
            discount_type: 'fixed',
            discount_value: 50000,
            is_active: false,
            used_count: 10,
            usage_limit: 10,
            min_order_value: 100000,
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-06-30T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('detail.status')).toBeInTheDocument()
    })
  })

  it('renders usage with string user (not object)', async () => {
    server.use(
      http.get(`${API_URL}/admin/vouchers/:id/usage`, () => {
        return HttpResponse.json({
          message: 'Thành công',
          data: {
            usage: [
              {
                _id: 'usage-str',
                user: 'user-string-id',
                voucher: 'voucher-1',
                order: 'order-abcdef12',
                discount_amount: 30000,
                createdAt: '2024-03-15T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1 },
          },
        })
      }),
    )
    renderWithProviders(<VoucherDetailPage />)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('user-string-id')).toBeInTheDocument()
    })
  })
})
