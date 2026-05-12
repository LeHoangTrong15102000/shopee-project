import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import LoyaltyPage from '../LoyaltyPage'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock loyalty API
const mockGetPoints = vi.fn()
const mockGetTransactions = vi.fn()
vi.mock('src/apis/loyalty.api', () => ({
  default: {
    getPoints: (...args: any[]) => mockGetPoints(...args),
    getTransactions: (...args: any[]) => mockGetTransactions(...args),
  },
}))

// Mock LoyaltyPointsCard component
vi.mock('src/components/LoyaltyPointsCard', () => ({
  default: ({ points }: { points: any }) => (
    <div data-testid="loyalty-points-card">
      <span data-testid="available-points">{points.available_points}</span>
    </div>
  ),
}))

// Mock SEO component
vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

const mockPoints = {
  total_points: 1500,
  available_points: 1200,
  pending_points: 300,
  expiring_soon: { points: 100, expire_date: '2025-12-31' },
}

const mockTransactions = [
  {
    _id: 'tx-1',
    type: 'earn' as const,
    points: 100,
    description: 'Order reward',
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    _id: 'tx-2',
    type: 'bonus' as const,
    points: 50,
    description: 'Welcome bonus',
    createdAt: '2024-06-02T10:00:00Z',
  },
  {
    _id: 'tx-3',
    type: 'redeem' as const,
    points: 200,
    description: 'Voucher redemption',
    createdAt: '2024-06-03T10:00:00Z',
  },
  {
    _id: 'tx-4',
    type: 'expire' as const,
    points: 30,
    description: 'Points expired',
    createdAt: '2024-06-04T10:00:00Z',
  },
]

describe('LoyaltyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPoints.mockResolvedValue({
      data: { data: mockPoints },
    })
    mockGetTransactions.mockResolvedValue({
      data: { data: { transactions: mockTransactions } },
    })
  })

  it('renders loading skeletons initially', () => {
    mockGetPoints.mockReturnValue(new Promise(() => {}))
    mockGetTransactions.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<LoyaltyPage />)
    const animatedEls = document.querySelectorAll('.animate-pulse')
    expect(animatedEls.length).toBeGreaterThan(0)
  })

  it('renders error state when points query fails', async () => {
    mockGetPoints.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('loyalty.errorLoading')).toBeInTheDocument()
    })
  })

  it('renders points card when data loads', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByTestId('loyalty-points-card')).toBeInTheDocument()
      expect(screen.getByTestId('available-points')).toHaveTextContent('1200')
    })
  })

  it('renders transaction history list', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('Order reward')).toBeInTheDocument()
      expect(screen.getByText('Welcome bonus')).toBeInTheDocument()
      expect(screen.getByText('Voucher redemption')).toBeInTheDocument()
      expect(screen.getByText('Points expired')).toBeInTheDocument()
    })
  })

  it('renders empty transactions message when no transactions', async () => {
    mockGetTransactions.mockResolvedValue({
      data: { data: { transactions: [] } },
    })
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('loyalty.noTransactions')).toBeInTheDocument()
    })
  })

  it('displays correct prefix for earn transaction', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      // earn type should show + prefix
      const earnEl = screen.getByText('+100')
      expect(earnEl).toBeInTheDocument()
    })
  })

  it('displays correct prefix for bonus transaction', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      // bonus type should show + prefix
      const bonusEl = screen.getByText('+50')
      expect(bonusEl).toBeInTheDocument()
    })
  })

  it('displays correct prefix for redeem transaction', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      // redeem type should show - prefix
      const redeemEl = screen.getByText('-200')
      expect(redeemEl).toBeInTheDocument()
    })
  })

  it('displays correct prefix for expire transaction', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      // expire type should show - prefix
      const expireEl = screen.getByText('-30')
      expect(expireEl).toBeInTheDocument()
    })
  })
})
