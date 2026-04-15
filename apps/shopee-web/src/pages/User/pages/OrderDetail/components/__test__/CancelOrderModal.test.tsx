import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CancelOrderModal from '../CancelOrderModal'

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
  modalBackdropVariants: { hidden: {}, visible: {}, exit: {} },
  modalContentVariants: { hidden: {}, visible: {}, exit: {} },
  reducedMotionVariants: { hidden: {}, visible: {} },
}))

describe('CancelOrderModal', () => {
  const defaultProps = {
    cancelReason: '',
    setCancelReason: vi.fn(),
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isPending: false,
    shouldReduceMotion: false,
  }

  it('renders title', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByText('Hủy đơn hàng')).toBeInTheDocument()
  })

  it('renders irreversible warning', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByText('Hành động này không thể hoàn tác')).toBeInTheDocument()
  })

  it('renders confirmation message', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByText(/Bạn có chắc chắn muốn hủy đơn hàng này/)).toBeInTheDocument()
  })

  it('renders textarea with placeholder', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Lý do hủy đơn (không bắt buộc)')).toBeInTheDocument()
  })

  it('renders close button with aria label', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByLabelText('Đóng modal')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<CancelOrderModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Đóng modal'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<CancelOrderModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Xác nhận hủy'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('shows processing text when isPending', () => {
    render(<CancelOrderModal {...defaultProps} isPending={true} />)
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
  })

  it('shows back button', () => {
    render(<CancelOrderModal {...defaultProps} />)
    expect(screen.getByText('Quay lại')).toBeInTheDocument()
  })

  it('calls setCancelReason on textarea change', () => {
    const setCancelReason = vi.fn()
    render(<CancelOrderModal {...defaultProps} setCancelReason={setCancelReason} />)
    fireEvent.change(screen.getByPlaceholderText('Lý do hủy đơn (không bắt buộc)'), {
      target: { value: 'Changed mind' },
    })
    expect(setCancelReason).toHaveBeenCalledWith('Changed mind')
  })
})
