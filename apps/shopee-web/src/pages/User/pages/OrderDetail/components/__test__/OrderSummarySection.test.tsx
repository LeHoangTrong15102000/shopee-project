import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderSummarySection from '../OrderSummarySection'

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
}))

vi.mock('src/styles/animations/motion.config', () => ({
  ANIMATION_DURATION: { fast: 0.15, normal: 0.3 },
  STAGGER_DELAY: { slow: 0.1, normal: 0.05 },
}))

vi.mock('../orderDetail.constants', () => ({
  reducedMotionVariants: { hidden: {}, visible: {} },
  sectionVariants: { hidden: {}, visible: {} },
}))

const baseOrder = {
  subtotal: 500000,
  shippingFee: 30000,
  discount: 0,
  coinsDiscount: 0,
  coinsUsed: 0,
  total: 530000,
}

describe('OrderSummarySection', () => {
  it('renders total header', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.getByText('Tổng cộng')).toBeInTheDocument()
  })

  it('shows subtotal', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.getByText('Tạm tính')).toBeInTheDocument()
  })

  it('shows shipping fee', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.getByText('Phí vận chuyển')).toBeInTheDocument()
  })

  it('shows total amount', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.getByText('Tổng tiền')).toBeInTheDocument()
  })

  it('shows voucher discount when > 0', () => {
    const order = { ...baseOrder, discount: 50000 }
    render(<OrderSummarySection order={order as any} shouldReduceMotion={false} />)
    expect(screen.getByText('Giảm giá voucher')).toBeInTheDocument()
  })

  it('hides voucher discount when 0', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.queryByText('Giảm giá voucher')).toBeNull()
  })

  it('shows coins discount when > 0', () => {
    const order = { ...baseOrder, coinsDiscount: 10000, coinsUsed: 100 }
    render(<OrderSummarySection order={order as any} shouldReduceMotion={false} />)
    expect(screen.getByText(/Giảm giá xu/)).toBeInTheDocument()
  })

  it('hides coins discount when 0', () => {
    render(<OrderSummarySection order={baseOrder as any} shouldReduceMotion={false} />)
    expect(screen.queryByText(/Giảm giá xu/)).toBeNull()
  })
})
