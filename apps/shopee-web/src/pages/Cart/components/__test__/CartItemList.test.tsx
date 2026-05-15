import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CartItemList from '../CartItemList'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ alt }: any) => <img alt={alt} />,
}))

vi.mock('src/components/QuantityController', () => ({
  default: ({ value }: any) => <div data-testid="qty-ctrl">{value}</div>,
}))

vi.mock('src/components/RealTimeStockAlert', () => ({
  InlineStockAlert: ({ productName }: any) => <div data-testid="stock-alert">{productName}</div>,
}))

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked }: any) => (
    <input type="checkbox" checked={checked} readOnly data-testid="checkbox" />
  ),
}))

vi.mock('src/components/StockBadge', () => ({
  default: () => <span data-testid="stock-badge" />,
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

const fmt = (n: number) => n.toLocaleString()
const genId = ({ name, id }: { name: string; id: string }) => `${name}-i-${id}`

const makePurchase = (id: string, overrides: any = {}) => ({
  _id: id,
  isChecked: false,
  price: 100000,
  buy_count: 2,
  product: {
    _id: `prod-${id}`,
    name: `Product ${id}`,
    image: 'img.jpg',
    price: 100000,
    price_before_discount: 150000,
    quantity: 50,
    ...overrides.product,
  },
  ...overrides,
})

const baseProps = {
  extendedPurchases: [makePurchase('1'), makePurchase('2')],
  purchasesInCart: [{ buy_count: 2 }, { buy_count: 2 }] as any[],
  isAllChecked: false,
  inlineAlerts: new Map(),
  handleChecked: vi.fn(() => vi.fn()),
  handleCheckedAll: vi.fn(),
  handleQuantity: vi.fn(),
  handleTypeQuantity: vi.fn(() => vi.fn()),
  handleDelete: vi.fn(() => vi.fn()),
  handleSaveForLater: vi.fn(() => vi.fn()),
  handleDismissInlineAlert: vi.fn(),
  path: { home: '/' },
  formatCurrency: fmt,
  generateNameId: genId,
}

describe('CartItemList', () => {
  it('renders desktop header columns', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument()
    expect(screen.getByText('Đơn giá')).toBeInTheDocument()
    expect(screen.getByText('Số lượng')).toBeInTheDocument()
    expect(screen.getByText('Số tiền')).toBeInTheDocument()
    expect(screen.getByText('Thao tác')).toBeInTheDocument()
  })

  it('renders product names', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByText('Product 1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Product 2').length).toBeGreaterThanOrEqual(1)
  })

  it('renders prices with strikethrough and current', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByText(/₫150,000/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/₫100,000/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders quantity controllers', () => {
    render(<CartItemList {...baseProps} />)
    const ctrls = screen.getAllByTestId('qty-ctrl')
    expect(ctrls.length).toBeGreaterThanOrEqual(2)
  })

  it('renders total per item', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByText(/₫200,000/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders save and delete buttons', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByText('Lưu').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Xóa').length).toBeGreaterThanOrEqual(1)
  })

  it('renders empty when no purchases', () => {
    render(<CartItemList {...baseProps} extendedPurchases={[]} />)
    expect(screen.queryByTestId('qty-ctrl')).toBeNull()
  })

  it('renders stock badges', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByTestId('stock-badge').length).toBeGreaterThanOrEqual(2)
  })

  it('renders inline stock alert when present', () => {
    const alerts = new Map([
      ['prod-1', { productName: 'Alert Product', newStock: 5, severity: 'warning' }],
    ])
    render(<CartItemList {...baseProps} inlineAlerts={alerts as any} />)
    expect(screen.getAllByTestId('stock-alert').length).toBeGreaterThanOrEqual(1)
  })

  it('hides inline stock alert when not present', () => {
    render(<CartItemList {...baseProps} inlineAlerts={new Map()} />)
    expect(screen.queryByTestId('stock-alert')).toBeNull()
  })

  it('renders select all in mobile view', () => {
    render(<CartItemList {...baseProps} />)
    expect(screen.getAllByText(/Chọn tất cả.*\(2\)/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders checkboxes for each item', () => {
    render(<CartItemList {...baseProps} />)
    const checkboxes = screen.getAllByTestId('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
  })
})
