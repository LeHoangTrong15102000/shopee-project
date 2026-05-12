import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import VouchersPage from '../VouchersPage'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock voucher API
const mockGetVouchers = vi.fn()
const mockCollectVoucher = vi.fn()
vi.mock('src/apis/voucher.api', () => ({
  default: {
    getVouchers: (...args: any[]) => mockGetVouchers(...args),
    collectVoucher: (...args: any[]) => mockCollectVoucher(...args),
  },
}))

// Mock VoucherCard component
vi.mock('src/components/VoucherCard', () => ({
  default: ({ voucher, onSave }: { voucher: any; onSave: (id: string) => void }) => (
    <div data-testid={`voucher-card-${voucher._id}`}>
      <span>{voucher.code}</span>
      <button onClick={() => onSave(voucher._id)} data-testid={`collect-btn-${voucher._id}`}>
        collect
      </button>
    </div>
  ),
}))

// Mock SEO component
vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockVouchers = [
  {
    _id: 'voucher-1',
    code: 'SAVE10',
    discount_type: 'percentage',
    discount_value: 10,
    is_collected: false,
  },
  {
    _id: 'voucher-2',
    code: 'FLAT50K',
    discount_type: 'fixed',
    discount_value: 50000,
    is_collected: false,
  },
]

describe('VouchersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVouchers.mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    })
    mockCollectVoucher.mockResolvedValue({
      data: { data: { message: 'Collected' } },
    })
  })

  it('renders loading skeletons initially', () => {
    // Return a never-resolving promise so the component stays in loading state
    mockGetVouchers.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<VouchersPage />)
    // Skeletons are rendered as animated divs — check for the skeleton container
    const animatedEls = document.querySelectorAll('.animate-pulse')
    expect(animatedEls.length).toBeGreaterThan(0)
  })

  it('renders empty state when no vouchers', async () => {
    mockGetVouchers.mockResolvedValue({
      data: { data: { vouchers: [] } },
    })
    renderWithProviders(<VouchersPage />)
    await waitFor(() => {
      expect(screen.getByText('empty')).toBeInTheDocument()
    })
  })

  it('renders voucher grid when data is available', async () => {
    renderWithProviders(<VouchersPage />)
    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-voucher-1')).toBeInTheDocument()
      expect(screen.getByTestId('voucher-card-voucher-2')).toBeInTheDocument()
    })
  })

  it('redirects to login when unauthenticated user tries to collect', async () => {
    const { user } = renderWithProviders(<VouchersPage />)
    await waitFor(() => {
      expect(screen.getByTestId('collect-btn-voucher-1')).toBeInTheDocument()
    })
    await user.click(screen.getByTestId('collect-btn-voucher-1'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(mockCollectVoucher).not.toHaveBeenCalled()
  })

  it('calls collectVoucher mutation when authenticated user clicks collect', async () => {
    // Render with authenticated context by overriding localStorage token
    // renderWithProviders uses getInitialAppContext which reads from localStorage
    // We mock the AppContext directly via the context module
    const { AppContext } = await import('src/contexts/app.context')
    const { render } = await import('@testing-library/react')
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
    const { BrowserRouter } = await import('react-router')
    const React = await import('react')

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 }, mutations: { retry: false } },
    })

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          BrowserRouter,
          null,
          React.createElement(
            AppContext.Provider,
            { value: { isAuthenticated: true, setIsAuthenticated: vi.fn(), profile: null, setProfile: vi.fn(), reset: vi.fn() } },
            React.createElement(VouchersPage),
          ),
        ),
      ),
    )

    await waitFor(() => {
      expect(screen.getByTestId('collect-btn-voucher-1')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('collect-btn-voucher-1'))

    await waitFor(() => {
      expect(mockCollectVoucher).toHaveBeenCalledWith('voucher-1')
    })
  })
})
