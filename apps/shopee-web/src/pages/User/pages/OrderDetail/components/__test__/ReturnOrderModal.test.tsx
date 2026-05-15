import { describe, it, expect} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReturnOrderModal from '../ReturnOrderModal'

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

describe('ReturnOrderModal', () => {
  const defaultProps = {
    returnReason: '',
    setReturnReason: vi.fn(),
    returnReasonError: '',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isPending: false,
    shouldReduceMotion: false,
  }

  it('renders title', () => {
    render(<ReturnOrderModal {...defaultProps} />)
    expect(screen.getByText('Trả hàng/Hoàn tiền')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<ReturnOrderModal {...defaultProps} />)
    expect(
      screen.getByText('Vui lòng cho chúng tôi biết lý do bạn muốn trả hàng'),
    ).toBeInTheDocument()
  })

  it('renders textarea with placeholder', () => {
    render(<ReturnOrderModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Nhập lý do trả hàng (bắt buộc)')).toBeInTheDocument()
  })

  it('renders close button with aria label', () => {
    render(<ReturnOrderModal {...defaultProps} />)
    expect(screen.getByLabelText('Đóng modal')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ReturnOrderModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Đóng modal'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<ReturnOrderModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Xác nhận trả hàng'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('shows processing text when isPending', () => {
    render(<ReturnOrderModal {...defaultProps} isPending={true} />)
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
  })

  it('shows back button', () => {
    render(<ReturnOrderModal {...defaultProps} />)
    expect(screen.getByText('Đóng')).toBeInTheDocument()
  })

  it('calls setReturnReason on textarea change', () => {
    const setReturnReason = vi.fn()
    render(<ReturnOrderModal {...defaultProps} setReturnReason={setReturnReason} />)
    fireEvent.change(screen.getByPlaceholderText('Nhập lý do trả hàng (bắt buộc)'), {
      target: { value: 'Broken' },
    })
    expect(setReturnReason).toHaveBeenCalledWith('Broken')
  })

  it('shows error message when returnReasonError is set', () => {
    render(<ReturnOrderModal {...defaultProps} returnReasonError="Vui lòng nhập lý do" />)
    expect(screen.getByText('Vui lòng nhập lý do')).toBeInTheDocument()
  })
})
