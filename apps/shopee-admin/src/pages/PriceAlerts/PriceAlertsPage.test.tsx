import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import PriceAlertsPage from './PriceAlertsPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('PriceAlertsPage', () => {
  it('renders page header', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders price alerts table after loading', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders column headers', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.user')).toBeInTheDocument()
    expect(screen.getByText('columns.product')).toBeInTheDocument()
    expect(screen.getByText('columns.status')).toBeInTheDocument()
  })

  it('renders triggered/pending badges', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('triggered')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
    })
  })

  it('shows backend required state on 404', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByText('backendRequired')).toBeInTheDocument()
    })
  })

  it('shows backend required state on 403', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByText('backendRequired')).toBeInTheDocument()
    })
  })

  it('shows error state on other API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('shows empty state when no alerts', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: { alerts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
        })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByText('emptyState')).toBeInTheDocument()
    })
  })

  it('renders target price column', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.targetPrice')).toBeInTheDocument()
  })

  it('renders current price column', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.currentPrice')).toBeInTheDocument()
  })

  it('renders date column', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.date')).toBeInTheDocument()
  })

  it('renders user names from populated user objects', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })
  })

  it('renders product names from populated product objects', async () => {
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    })
  })

  it('renders user ID fallback when user is a string', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            alerts: [
              {
                _id: 'alert-str',
                user: 'user-id-string-123',
                product: { _id: 'prod-1', name: 'Test Product' },
                target_price: 100,
                current_price: 120,
                is_triggered: false,
                createdAt: '2024-01-15T08:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('ring-123')).toBeInTheDocument()
    })
  })

  it('renders product ID fallback when product is a string', async () => {
    server.use(
      http.get(`${API_URL}/admin/price-alerts`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            alerts: [
              {
                _id: 'alert-str-prod',
                user: { _id: 'user-1', name: 'Test User', email: 'test@test.com' },
                product: 'product-id-string-456',
                target_price: 200,
                current_price: 250,
                is_triggered: true,
                createdAt: '2024-01-15T08:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      }),
    )
    renderWithProviders(<PriceAlertsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('ring-456')).toBeInTheDocument()
    })
  })
})
