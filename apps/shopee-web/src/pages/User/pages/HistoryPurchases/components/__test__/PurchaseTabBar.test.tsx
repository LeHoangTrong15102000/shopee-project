import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PurchaseTabBar from '../PurchaseTabBar'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/constant/purchase', () => ({
  purchasesStatus: {
    all: 0,
    waitForConfirmation: 1,
    waitForGetting: 2,
    inProgress: 3,
    delivered: 4,
    cancelled: 5,
  },
}))

describe('PurchaseTabBar', () => {
  it('renders all 6 tabs', () => {
    render(<PurchaseTabBar status={0} onStatusChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(6)
  })

  it('renders tab labels', () => {
    render(<PurchaseTabBar status={0} onStatusChange={vi.fn()} />)
    expect(screen.getByText('Tất cả')).toBeInTheDocument()
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Đã hủy')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<PurchaseTabBar status={0} onStatusChange={vi.fn()} />)
    const allTab = screen.getByText('Tất cả').closest('button')
    expect(allTab?.className).toContain('border-b-orange')
  })

  it('calls onStatusChange when tab clicked', () => {
    const onChange = vi.fn()
    render(<PurchaseTabBar status={0} onStatusChange={onChange} />)
    fireEvent.click(screen.getByText('Đã hủy'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('non-active tabs have different styling', () => {
    render(<PurchaseTabBar status={0} onStatusChange={vi.fn()} />)
    const cancelledTab = screen.getByText('Đã hủy').closest('button')
    expect(cancelledTab?.className).toContain('border-b-gray-200')
  })
})
