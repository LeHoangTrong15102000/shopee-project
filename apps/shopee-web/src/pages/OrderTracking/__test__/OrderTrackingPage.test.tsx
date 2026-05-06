import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderTrackingPage from '../OrderTrackingPage'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useParams: () => ({ number: undefined }),
  }
})

vi.mock('src/apis/orderTracking.api', () => ({
  default: {
    getTrackingByNumber: vi.fn().mockResolvedValue({
      data: {
        data: {
          tracking_number: 'TRK123456',
          carrier: 'GHN',
          status: 'in_transit',
          estimated_delivery: '2024-12-31',
          shipping_address: {
            name: 'Nguyen Van A',
            phone: '0123456789',
            address: '123 Main St',
            ward: 'Ward 1',
            district: 'District 1',
            province: 'HCMC',
          },
          events: [
            {
              timestamp: '2024-12-01T10:00:00Z',
              status: 'picked_up',
              description: 'Package picked up',
              location: 'HCMC',
            },
          ],
        },
      },
    }),
  },
}))

vi.mock('src/components/SEO', () => ({ default: () => null }))
vi.mock('src/components/OrderTrackingTimeline', () => ({
  default: ({ tracking }: any) => (
    <div data-testid="tracking-timeline">{tracking.tracking_number}</div>
  ),
}))

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

describe('OrderTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page heading', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Track Your Order')).toBeInTheDocument()
  })

  it('renders tracking number input', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('textbox', { name: 'Tracking number' })).toBeInTheDocument()
  })

  it('renders Track button', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: /Track/i })).toBeInTheDocument()
  })

  it('shows empty state prompt when no tracking number entered', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    expect(
      screen.getByText('Enter a tracking number above to see your shipment status'),
    ).toBeInTheDocument()
  })

  it('Track button is disabled when input is empty', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    const btn = screen.getByRole('button', { name: /Track/i })
    expect(btn).toBeDisabled()
  })

  it('Track button becomes enabled when tracking number is entered', () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    const input = screen.getByRole('textbox', { name: 'Tracking number' })
    fireEvent.change(input, { target: { value: 'TRK123456' } })
    const btn = screen.getByRole('button', { name: /Track/i })
    expect(btn).not.toBeDisabled()
  })

  it('shows tracking result after submitting tracking number', async () => {
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    const input = screen.getByRole('textbox', { name: 'Tracking number' })
    fireEvent.change(input, { target: { value: 'TRK123456' } })
    const form = input.closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByTestId('tracking-timeline')).toBeInTheDocument()
    })
  })

  it('shows error state when tracking not found', async () => {
    const orderTrackingApi = await import('src/apis/orderTracking.api')
    // Use mockRejectedValue (permanent) so all attempts including retry: 1 fail
    vi.mocked(orderTrackingApi.default.getTrackingByNumber).mockRejectedValue(
      new Error('Not found'),
    )
    render(<OrderTrackingPage />, { wrapper: createWrapper() })
    const input = screen.getByRole('textbox', { name: 'Tracking number' })
    fireEvent.change(input, { target: { value: 'INVALID' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(
      () => {
        expect(screen.getByText('Tracking information not found')).toBeInTheDocument()
      },
      { timeout: 10000 },
    )
  })
})
