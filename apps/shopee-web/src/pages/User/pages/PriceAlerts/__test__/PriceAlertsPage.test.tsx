import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PriceAlertsPage from '../PriceAlertsPage'

const mockGetAlerts = vi.fn()
const mockDeleteAlert = vi.fn()

vi.mock('src/apis/priceAlert.api', () => ({
  default: {
    get getAlerts() {
      return mockGetAlerts
    },
    get deleteAlert() {
      return mockDeleteAlert
    },
  },
}))

vi.mock('src/components/SEO', () => ({ default: () => null }))

const alertsData = {
  data: {
    data: {
      alerts: [
        {
          _id: 'alert-1',
          productId: 'prod-1',
          productName: 'Test Product',
          productImage: undefined,
          targetPrice: 80000,
          currentPrice: 100000,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          _id: 'alert-2',
          productId: 'prod-2',
          productName: 'Cheap Product',
          productImage: undefined,
          targetPrice: 50000,
          currentPrice: 40000,
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
    },
  },
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  )
}

beforeEach(() => {
  mockGetAlerts.mockResolvedValue(alertsData)
  mockDeleteAlert.mockResolvedValue({ data: { data: { message: 'Deleted' } } })
})

describe('PriceAlertsPage', () => {
  it('renders page heading', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Price Alerts')).toBeInTheDocument()
    })
  })

  it('renders page subtitle', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(
        screen.getByText('Get notified when products drop below your target price'),
      ).toBeInTheDocument()
    })
  })

  it('renders alert items after data loads', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('Cheap Product')).toBeInTheDocument()
    })
  })

  it('renders delete buttons for each alert', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /Remove price alert/ })
      expect(deleteButtons.length).toBe(2)
    })
  })

  it('shows price target reached badge when currentPrice <= targetPrice', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Price target reached!')).toBeInTheDocument()
    })
  })

  it('shows loading spinner initially', () => {
    const { container } = render(<PriceAlertsPage />, { wrapper: createWrapper() })
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeNull()
  })

  it('shows empty state when no alerts exist', async () => {
    mockGetAlerts.mockResolvedValueOnce({
      data: { data: { alerts: [] } },
    })
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('No price alerts set')).toBeInTheDocument()
    })
  })

  it('shows error state when API call fails', async () => {
    // Use mockRejectedValue (permanent) so all attempts including retries fail
    mockGetAlerts.mockRejectedValue(new Error('Network error'))
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(
      () => {
        expect(screen.getByText('Unable to load price alerts')).toBeInTheDocument()
      },
      { timeout: 10000 },
    )
  })

  it('calls deleteAlert when delete button is clicked', async () => {
    render(<PriceAlertsPage />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByRole('button', { name: /Remove price alert/ })
    fireEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(mockDeleteAlert).toHaveBeenCalledWith('alert-1')
    })
  })
})
