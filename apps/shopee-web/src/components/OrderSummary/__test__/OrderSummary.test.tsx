import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OrderSummary from '../OrderSummary'
import type { ExtendedPurchase } from 'src/types/purchases.type'
import type { ShippingMethod } from 'src/types/checkout.type'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, key, ...rest } = props
      return <span {...rest}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    )
  },
}))

vi.mock('src/components/Icons', () => ({
  ShippingIcon: ({ type, className }: any) => <span className={className}>🚚</span>,
}))

vi.mock('src/utils/date', () => ({
  getEstimatedDeliveryDate: (days: string) => `Thứ 3, 15/01 - Thứ 5, 17/01`,
}))

const makeItem = (overrides: Partial<ExtendedPurchase> = {}): ExtendedPurchase =>
  ({
    _id: 'p1',
    buy_count: 2,
    price: 100000,
    price_before_discount: 150000,
    status: -1,
    user: 'u1',
    product: {
      _id: 'prod1',
      name: 'Áo thun',
      image: 'img.jpg',
      images: [],
      price: 100000,
      price_before_discount: 150000,
      rating: 4,
      sold: 10,
      quantity: 50,
      view: 100,
      category: { _id: 'c1', name: 'Fashion' },
      description: '',
      location: 'HCM',
      createdAt: '',
      updatedAt: '',
    },
    createdAt: '',
    updatedAt: '',
    disabled: false,
    isChecked: true,
    ...overrides,
  }) as ExtendedPurchase

const mockShipping: ShippingMethod = {
  _id: 's1',
  name: 'Giao hàng nhanh',
  description: 'Fast',
  price: 25000,
  estimatedDays: '2-3 ngày',
  icon: 'express',
}

describe('OrderSummary', () => {
  it('renders title and product count', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Đơn hàng của bạn')).toBeInTheDocument()
    expect(screen.getByText('1 sản phẩm')).toBeInTheDocument()
  })

  it('renders product name and image', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Áo thun')).toBeInTheDocument()
    expect(screen.getByAltText('Áo thun')).toBeInTheDocument()
  })

  it('renders buy count', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('SL: 2')).toBeInTheDocument()
  })

  it('renders subtotal', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Tạm tính')).toBeInTheDocument()
  })

  it('renders product discount when price < price_before_discount', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Giảm giá sản phẩm')).toBeInTheDocument()
  })

  it('does not render product discount when prices are equal', () => {
    const item = makeItem({ price: 100000, price_before_discount: 100000 })
    render(<OrderSummary items={[item]} shippingMethod={null} />)
    expect(screen.queryByText('Giảm giá sản phẩm')).not.toBeInTheDocument()
  })

  it('renders shipping fee when method selected', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={mockShipping} />)
    expect(screen.getByText('₫25.000')).toBeInTheDocument()
  })

  it('renders "not selected" when no shipping method', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Chưa chọn')).toBeInTheDocument()
  })

  it('renders voucher section when discount applied', () => {
    render(
      <OrderSummary
        items={[makeItem()]}
        shippingMethod={null}
        voucherDiscount={30000}
        voucherCode="SAVE30K"
      />,
    )
    expect(screen.getByText(/SAVE30K/)).toBeInTheDocument()
    expect(screen.getByText('Voucher giảm giá')).toBeInTheDocument()
  })

  it('does not render voucher section when no discount', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.queryByText('Voucher giảm giá')).not.toBeInTheDocument()
  })

  it('renders remove voucher button when onRemoveVoucher provided', () => {
    const onRemove = vi.fn()
    render(
      <OrderSummary
        items={[makeItem()]}
        shippingMethod={null}
        voucherDiscount={30000}
        voucherCode="SAVE30K"
        onRemoveVoucher={onRemove}
      />,
    )
    const removeBtn = screen.getByLabelText('Xóa mã giảm giá')
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalled()
  })

  it('does not render remove voucher button when onRemoveVoucher not provided', () => {
    render(
      <OrderSummary
        items={[makeItem()]}
        shippingMethod={null}
        voucherDiscount={30000}
        voucherCode="SAVE30K"
      />,
    )
    expect(screen.queryByLabelText('Xóa mã giảm giá')).not.toBeInTheDocument()
  })

  it('renders coins discount when coins used', () => {
    render(
      <OrderSummary items={[makeItem()]} shippingMethod={null} coinsUsed={500} coinsValue={1} />,
    )
    expect(screen.getByText('Shopee Xu (500 xu)')).toBeInTheDocument()
  })

  it('does not render coins section when no coins used', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.queryByText(/Shopee Xu/)).not.toBeInTheDocument()
  })

  it('renders VAT line', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('VAT (10%)')).toBeInTheDocument()
  })

  it('renders total payment', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Tổng thanh toán')).toBeInTheDocument()
  })

  it('renders savings when total discount > 0', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText(/Tiết kiệm/)).toBeInTheDocument()
  })

  it('renders estimated delivery when shipping method selected', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={mockShipping} />)
    expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument()
    expect(screen.getByText(/Dự kiến giao/)).toBeInTheDocument()
  })

  it('does not render estimated delivery when no shipping method', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.queryByText(/Dự kiến giao/)).not.toBeInTheDocument()
  })

  it('renders money-back guarantee badge', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.getByText('Đảm bảo hoàn tiền')).toBeInTheDocument()
    expect(screen.getByText('Hoàn tiền 100% nếu hàng không như mô tả')).toBeInTheDocument()
  })

  it('shows expand button when more than 2 items', () => {
    const items = [makeItem({ _id: 'p1' }), makeItem({ _id: 'p2' }), makeItem({ _id: 'p3' })]
    render(<OrderSummary items={items} shippingMethod={null} />)
    expect(screen.getByText(/Xem thêm 1 sản phẩm/)).toBeInTheDocument()
  })

  it('does not show expand button when 2 or fewer items', () => {
    render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    expect(screen.queryByText(/Xem thêm/)).not.toBeInTheDocument()
  })

  it('toggles expand/collapse when button clicked', () => {
    const items = [makeItem({ _id: 'p1' }), makeItem({ _id: 'p2' }), makeItem({ _id: 'p3' })]
    render(<OrderSummary items={items} shippingMethod={null} />)
    const expandBtn = screen.getByText(/Xem thêm/)
    fireEvent.click(expandBtn)
    expect(screen.getByText('Thu gọn')).toBeInTheDocument()
  })

  it('shows strikethrough price when item has discount', () => {
    const { container } = render(<OrderSummary items={[makeItem()]} shippingMethod={null} />)
    const strikethrough = container.querySelector('.line-through')
    expect(strikethrough).toBeInTheDocument()
  })

  it('does not show strikethrough when no discount', () => {
    const item = makeItem({ price: 100000, price_before_discount: 100000 })
    const { container } = render(<OrderSummary items={[item]} shippingMethod={null} />)
    const strikethrough = container.querySelector('.line-through')
    expect(strikethrough).not.toBeInTheDocument()
  })
})
