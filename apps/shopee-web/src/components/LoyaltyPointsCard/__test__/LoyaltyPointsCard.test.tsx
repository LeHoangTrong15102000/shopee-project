import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import LoyaltyPointsCard from '../LoyaltyPointsCard'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
}))

const basePoints = {
  available_points: 500,
  total_points: 1200,
  pending_points: 100,
  expiring_soon: {
    points: 0,
    expire_date: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
}

describe('LoyaltyPointsCard', () => {
  it('renders title and history button', () => {
    render(<LoyaltyPointsCard points={basePoints as any} />)
    expect(screen.getByText('Shopee Xu')).toBeInTheDocument()
    expect(screen.getByText('Lịch sử')).toBeInTheDocument()
  })

  it('shows available points label', () => {
    render(<LoyaltyPointsCard points={basePoints as any} />)
    expect(screen.getByText('xu khả dụng')).toBeInTheDocument()
  })

  it('shows total and pending points', () => {
    render(<LoyaltyPointsCard points={basePoints as any} />)
    expect(screen.getByText('Tổng xu')).toBeInTheDocument()
    expect(screen.getByText('Đang chờ')).toBeInTheDocument()
  })

  it('shows progress label', () => {
    render(<LoyaltyPointsCard points={basePoints as any} />)
    expect(screen.getByText('Tiến độ đến phần thưởng')).toBeInTheDocument()
  })

  it('shows remaining points to next reward', () => {
    render(<LoyaltyPointsCard points={basePoints as any} nextRewardThreshold={1000} />)
    expect(screen.getByText('Còn 500 xu')).toBeInTheDocument()
  })

  it('shows eligible when points exceed threshold', () => {
    const highPoints = { ...basePoints, available_points: 1500 }
    render(<LoyaltyPointsCard points={highPoints as any} nextRewardThreshold={1000} />)
    expect(screen.getByText('Đủ điều kiện!')).toBeInTheDocument()
  })

  it('shows expiry warning when points expiring within 7 days', () => {
    const expiringPoints = {
      ...basePoints,
      expiring_soon: {
        points: 50,
        expire_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
    }
    render(<LoyaltyPointsCard points={expiringPoints as any} />)
    expect(screen.getByText(/xu sẽ hết hạn/)).toBeInTheDocument()
  })

  it('does not show expiry warning when no points expiring', () => {
    render(<LoyaltyPointsCard points={basePoints as any} />)
    expect(screen.queryByText(/xu sẽ hết hạn/)).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(
      <LoyaltyPointsCard points={basePoints as any} className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows urgent expiry days when <= 3 days', () => {
    const urgentPoints = {
      ...basePoints,
      expiring_soon: {
        points: 30,
        expire_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
    }
    render(<LoyaltyPointsCard points={urgentPoints as any} />)
    expect(screen.getByText(/ngày nữa!/)).toBeInTheDocument()
  })
})
