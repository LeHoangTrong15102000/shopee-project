import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderStatusTracker from '../OrderStatusTracker'

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
}))

describe('OrderStatusTracker', () => {
  it('renders step labels', () => {
    render(<OrderStatusTracker currentStatus="pending" isSubscribed={false} />)
    expect(screen.getByText('Đơn Hàng Đã Đặt')).toBeInTheDocument()
    expect(screen.getByText('Vận Chuyển')).toBeInTheDocument()
    expect(screen.getByText('Chờ Giao Hàng')).toBeInTheDocument()
  })

  it('shows live tracking indicator when subscribed', () => {
    render(<OrderStatusTracker currentStatus="shipping" isSubscribed={true} />)
    expect(screen.getByText('Đang theo dõi trực tiếp')).toBeInTheDocument()
  })

  it('hides live tracking when not subscribed', () => {
    render(<OrderStatusTracker currentStatus="shipping" isSubscribed={false} />)
    expect(screen.queryByText('Đang theo dõi trực tiếp')).toBeNull()
  })

  it('shows cancelled status', () => {
    render(<OrderStatusTracker currentStatus="cancelled" isSubscribed={false} />)
    expect(screen.getByText('Đơn hàng đã bị hủy')).toBeInTheDocument()
    expect(screen.getByText('Liên hệ hỗ trợ nếu cần giúp đỡ')).toBeInTheDocument()
  })

  it('shows returned status', () => {
    render(<OrderStatusTracker currentStatus="returned" isSubscribed={false} />)
    expect(screen.getByText('Đơn hàng đã được trả lại')).toBeInTheDocument()
    expect(screen.getByText('Hoàn tiền sẽ được xử lý trong 3-5 ngày')).toBeInTheDocument()
  })

  it('hides step progress for cancelled status', () => {
    render(<OrderStatusTracker currentStatus="cancelled" isSubscribed={false} />)
    expect(screen.queryByText('Đơn Hàng Đã Đặt')).toBeNull()
  })

  it('hides step progress for returned status', () => {
    render(<OrderStatusTracker currentStatus="returned" isSubscribed={false} />)
    expect(screen.queryByText('Đơn Hàng Đã Đặt')).toBeNull()
  })

  it('shows order total with confirmed step label', () => {
    render(
      <OrderStatusTracker currentStatus="confirmed" isSubscribed={false} orderTotal={500000} />,
    )
    expect(screen.getByText(/Đã Xác Nhận Thông Tin Thanh Toán.*₫500,000/)).toBeInTheDocument()
  })

  it('shows step timestamps when provided', () => {
    const timestamps = { pending: '2026-03-19T08:30:00Z', confirmed: '2026-03-19T09:00:00Z' }
    render(
      <OrderStatusTracker
        currentStatus="confirmed"
        isSubscribed={false}
        stepTimestamps={timestamps}
      />,
    )
    // Timestamps are formatted with formatLastUpdate, just check they render
    const timeElements = screen.getAllByText(/\d{2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders progressbar', () => {
    render(<OrderStatusTracker currentStatus="processing" isSubscribed={false} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <OrderStatusTracker currentStatus="pending" isSubscribed={false} className="custom" />,
    )
    expect(container.firstChild).toHaveClass('custom')
  })

  it('handles null currentStatus', () => {
    render(<OrderStatusTracker currentStatus={null} isSubscribed={false} />)
    expect(screen.getByText('Đơn Hàng Đã Đặt')).toBeInTheDocument()
  })

  it('renders delivered step', () => {
    render(<OrderStatusTracker currentStatus="delivered" isSubscribed={false} />)
    expect(screen.getByText('Đánh Giá')).toBeInTheDocument()
  })

  it('shows live tracking aria label', () => {
    render(<OrderStatusTracker currentStatus="shipping" isSubscribed={true} />)
    expect(screen.getByLabelText('Đang theo dõi trạng thái đơn hàng trực tiếp')).toBeInTheDocument()
  })
})
