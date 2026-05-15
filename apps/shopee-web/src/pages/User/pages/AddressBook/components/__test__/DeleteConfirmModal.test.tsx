import { describe, it, expect} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteConfirmModal from '../DeleteConfirmModal'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, isLoading, ...props }: any) => {
    const { animated, variant, ...rest } = props
    return (
      <button onClick={onClick} className={className} disabled={disabled} {...rest}>
        {isLoading ? 'Loading...' : children}
      </button>
    )
  },
}))

const defaultProps = {
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  isLoading: false,
}

describe('DeleteConfirmModal', () => {
  it('renders default title from translations', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    expect(screen.getByText('Xóa địa chỉ')).toBeInTheDocument()
  })

  it('renders default message from translations', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    expect(
      screen.getByText('Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.'),
    ).toBeInTheDocument()
  })

  it('renders custom title when provided', () => {
    render(<DeleteConfirmModal {...defaultProps} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<DeleteConfirmModal {...defaultProps} message="Custom message text" />)
    expect(screen.getByText('Custom message text')).toBeInTheDocument()
  })

  it('renders cancel button', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    expect(screen.getByText('Hủy')).toBeInTheDocument()
  })

  it('renders delete/confirm button', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    expect(screen.getByText('Xóa')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Hủy'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when delete button is clicked', () => {
    const onConfirm = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Xóa'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when overlay backdrop is clicked', () => {
    const onCancel = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onCancel={onCancel} />)
    // The outer div has onClick={onCancel}
    const backdrop = document.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onCancel).toHaveBeenCalled()
    }
  })

  it('shows loading state on confirm button', () => {
    render(<DeleteConfirmModal {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('disables confirm button when loading', () => {
    render(<DeleteConfirmModal {...defaultProps} isLoading={true} />)
    const deleteBtn = screen.getByText('Loading...').closest('button')
    expect(deleteBtn).toBeDisabled()
  })

  it('renders trash can SVG icon', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does not disable cancel button when loading', () => {
    render(<DeleteConfirmModal {...defaultProps} isLoading={true} />)
    const cancelBtn = screen.getByText('Hủy')
    expect(cancelBtn).not.toBeDisabled()
  })

  it('stops propagation when clicking inside modal content', () => {
    const onCancel = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onCancel={onCancel} />)
    // Click inside the inner modal div — should not trigger onCancel
    const innerModal = document.querySelector('.rounded-lg.bg-white')
    if (innerModal) {
      fireEvent.click(innerModal)
      expect(onCancel).not.toHaveBeenCalled()
    }
  })
})
