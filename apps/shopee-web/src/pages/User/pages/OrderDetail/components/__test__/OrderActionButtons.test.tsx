import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OrderActionButtons from '../OrderActionButtons'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const safe = Object.fromEntries(
        Object.entries(props).filter(
          ([k]) =>
            ![
              'initial',
              'animate',
              'exit',
              'transition',
              'variants',
              'whileHover',
              'whileTap',
            ].includes(k),
        ),
      )
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, ...props }: any) => (
    <button onClick={onClick} className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/styles/animations/motion.config', () => ({
  ANIMATION_DURATION: { fast: 0.15, normal: 0.3 },
  STAGGER_DELAY: { slow: 0.1, normal: 0.05 },
}))

vi.mock('../orderDetail.constants', () => ({
  reducedMotionVariants: { hidden: {}, visible: {} },
  sectionVariants: { hidden: {}, visible: {} },
}))

describe('OrderActionButtons', () => {
  const defaultProps = {
    canCancel: false,
    canReturn: false,
    isReturnExpired: false,
    shouldReduceMotion: false,
    onShowCancelModal: vi.fn(),
    onShowReturnModal: vi.fn(),
  }

  it('returns null when no actions available', () => {
    const { container } = render(<OrderActionButtons {...defaultProps} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows cancel button when canCancel is true', () => {
    render(<OrderActionButtons {...defaultProps} canCancel={true} />)
    expect(screen.getByText('Hủy đơn hàng')).toBeInTheDocument()
  })

  it('shows return button when canReturn is true', () => {
    render(<OrderActionButtons {...defaultProps} canReturn={true} />)
    expect(screen.getByText('Trả hàng/Hoàn tiền')).toBeInTheDocument()
  })

  it('shows expired message when isReturnExpired is true', () => {
    render(<OrderActionButtons {...defaultProps} isReturnExpired={true} />)
    expect(screen.getByText('Đã quá hạn trả hàng')).toBeInTheDocument()
  })

  it('calls onShowCancelModal when cancel clicked', () => {
    const onShowCancelModal = vi.fn()
    render(
      <OrderActionButtons
        {...defaultProps}
        canCancel={true}
        onShowCancelModal={onShowCancelModal}
      />,
    )
    fireEvent.click(screen.getByText('Hủy đơn hàng'))
    expect(onShowCancelModal).toHaveBeenCalled()
  })

  it('calls onShowReturnModal when return clicked', () => {
    const onShowReturnModal = vi.fn()
    render(
      <OrderActionButtons
        {...defaultProps}
        canReturn={true}
        onShowReturnModal={onShowReturnModal}
      />,
    )
    fireEvent.click(screen.getByText('Trả hàng/Hoàn tiền'))
    expect(onShowReturnModal).toHaveBeenCalled()
  })

  it('shows both cancel and return buttons', () => {
    render(<OrderActionButtons {...defaultProps} canCancel={true} canReturn={true} />)
    expect(screen.getByText('Hủy đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Trả hàng/Hoàn tiền')).toBeInTheDocument()
  })

  it('has correct aria labels', () => {
    render(<OrderActionButtons {...defaultProps} canCancel={true} canReturn={true} />)
    expect(screen.getByLabelText('Hủy đơn hàng')).toBeInTheDocument()
    expect(screen.getByLabelText('Trả hàng/Hoàn tiền')).toBeInTheDocument()
  })
})
