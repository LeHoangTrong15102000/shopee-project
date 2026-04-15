import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShopeeProtectionModal from '../ShopeeProtectionModal'

vi.mock('src/components/BaseModal/BaseModal', () => ({
  default: ({ isOpen, onClose, children, className, ariaLabelledBy }: any) =>
    isOpen ? (
      <div data-testid="base-modal" className={className} aria-labelledby={ariaLabelledBy}>
        {children}
      </div>
    ) : null,
}))

describe('ShopeeProtectionModal', () => {
  it('renders nothing when closed', () => {
    render(<ShopeeProtectionModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument()
  })

  it('renders modal title when open', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument()
  })

  it('renders return policy section', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Trả hàng miễn phí 15 ngày')).toBeInTheDocument()
    expect(screen.getByText(/Miễn phí trả hàng trong 15 ngày/)).toBeInTheDocument()
  })

  it('renders return policy conditions', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Sản phẩm phải còn nguyên vẹn/)).toBeInTheDocument()
    expect(screen.getByText(/Shopee sẽ hỗ trợ hoàn tiền 100%/)).toBeInTheDocument()
    expect(screen.getByText(/Gửi yêu cầu trả hàng/)).toBeInTheDocument()
  })

  it('renders authenticity section', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Chính hãng 100%')).toBeInTheDocument()
    expect(screen.getByText(/Cam kết sản phẩm chính hãng/)).toBeInTheDocument()
  })

  it('renders authenticity details', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Quy trình kiểm định/)).toBeInTheDocument()
    expect(screen.getByText(/Hoàn tiền 200%/)).toBeInTheDocument()
  })

  it('renders free shipping section', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument()
    expect(screen.getByText(/Miễn phí vận chuyển cho đơn hàng/)).toBeInTheDocument()
  })

  it('renders free shipping details', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Giao hàng tiêu chuẩn 3-5 ngày/)).toBeInTheDocument()
    expect(screen.getByText(/Giao hàng nhanh có phụ thu/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ShopeeProtectionModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByLabelText(/Đóng/i)
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('has correct aria-labelledby', () => {
    render(<ShopeeProtectionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('base-modal')).toHaveAttribute(
      'aria-labelledby',
      'protection-modal-title',
    )
  })
})
