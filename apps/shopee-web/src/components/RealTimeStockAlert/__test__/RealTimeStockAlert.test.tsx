import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import RealTimeStockAlert, { InlineStockAlert } from '../RealTimeStockAlert'

// Track socket event handlers
let socketHandlers: Record<string, (data: any) => void> = {}
const mockSocket = {
  on: vi.fn((event: string, handler: (data: any) => void) => {
    socketHandlers[event] = handler
  }),
  off: vi.fn((event: string) => {
    delete socketHandlers[event]
  }),
  emit: vi.fn(),
}

vi.mock('src/hooks/useSocket', () => ({
  default: vi.fn(() => ({
    socket: mockSocket,
    isConnected: true,
  })),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({ children, ...props }: any) => {
          const { initial, animate, exit, transition, variants, layout, ...rest } = props
          const Tag = (typeof prop === 'string' ? prop : 'div') as any
          return <Tag {...rest}>{children}</Tag>
        },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, 'aria-label': ariaLabel, ...props }: any) => {
    const { animated, variant, isLoading, ...rest } = props
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    )
  },
}))

const fireInventoryAlert = (data: {
  product_id: string
  product_name: string
  current_quantity: number
  threshold?: number
  severity: 'warning' | 'critical'
}) => {
  const handler = socketHandlers['inventory_alert']
  if (handler) {
    act(() => {
      handler({ threshold: 5, ...data })
    })
  }
}

describe('RealTimeStockAlert', () => {
  beforeEach(() => {
    socketHandlers = {}
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders null when there are no alerts', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1', 'p2']} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a warning alert when a warning inventory event is received', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Áo thun',
      current_quantity: 3,
      severity: 'warning',
    })

    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('renders a critical alert with 🚫 icon', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Điện thoại',
      current_quantity: 1,
      severity: 'critical',
    })

    expect(screen.getByText('🚫')).toBeInTheDocument()
  })

  it('shows 🚫 icon when stock is zero (out of stock)', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Giày',
      current_quantity: 0,
      severity: 'warning',
    })

    expect(screen.getByText('🚫')).toBeInTheDocument()
  })

  it('ignores alerts for product IDs not in the list', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1', 'p2']} />)

    fireInventoryAlert({
      product_id: 'p99',
      product_name: 'Other Product',
      current_quantity: 2,
      severity: 'warning',
    })

    expect(container.firstChild).toBeNull()
  })

  it('shows stock changed text for non-zero stock', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Túi xách',
      current_quantity: 3,
      severity: 'warning',
    })

    // Should render some text about the product
    expect(screen.getByText(/Túi xách/)).toBeInTheDocument()
  })

  it('calls onStockChange callback when alert fires', () => {
    const onStockChange = vi.fn()
    render(<RealTimeStockAlert productIds={['p1']} onStockChange={onStockChange} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Mũ',
      current_quantity: 2,
      severity: 'warning',
    })

    expect(onStockChange).toHaveBeenCalledWith('p1', 2)
  })

  it('renders dismiss button for each alert', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Áo khoác',
      current_quantity: 4,
      severity: 'warning',
    })

    const dismissBtn = screen.getByRole('button')
    expect(dismissBtn).toBeInTheDocument()
  })

  it('removes alert when dismiss button is clicked', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Áo vest',
      current_quantity: 2,
      severity: 'warning',
    })

    const dismissBtn = screen.getByRole('button')
    act(() => {
      fireEvent.click(dismissBtn)
    })

    expect(container.firstChild).toBeNull()
  })

  it('auto-dismisses alert after 5 seconds', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Quần jeans',
      current_quantity: 3,
      severity: 'warning',
    })

    expect(container.firstChild).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(5100)
    })

    expect(container.firstChild).toBeNull()
  })

  it('replaces existing alert for same product with new one', () => {
    render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Sản phẩm A',
      current_quantity: 5,
      severity: 'warning',
    })

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Sản phẩm A',
      current_quantity: 0,
      severity: 'critical',
    })

    // Should only have one alert (the new one), so only 1 dismiss button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(1)
  })

  it('renders multiple alerts for different products', () => {
    render(<RealTimeStockAlert productIds={['p1', 'p2']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Sản phẩm 1',
      current_quantity: 3,
      severity: 'warning',
    })

    fireInventoryAlert({
      product_id: 'p2',
      product_name: 'Sản phẩm 2',
      current_quantity: 1,
      severity: 'critical',
    })

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
  })

  it('uses red styling for critical alerts', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Sản phẩm',
      current_quantity: 1,
      severity: 'critical',
    })

    const alertDiv = container.querySelector('.border-red-200')
    expect(alertDiv).toBeInTheDocument()
  })

  it('uses orange styling for warning alerts', () => {
    const { container } = render(<RealTimeStockAlert productIds={['p1']} />)

    fireInventoryAlert({
      product_id: 'p1',
      product_name: 'Sản phẩm',
      current_quantity: 3,
      severity: 'warning',
    })

    const alertDiv = container.querySelector('.border-orange-200')
    expect(alertDiv).toBeInTheDocument()
  })
})

describe('InlineStockAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders warning alert with ⚠️ icon', () => {
    render(
      <InlineStockAlert
        productId="p1"
        productName="Áo thun"
        newStock={3}
        severity="warning"
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('renders critical alert with 🚫 icon', () => {
    render(
      <InlineStockAlert
        productId="p1"
        productName="Áo thun"
        newStock={1}
        severity="critical"
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByText('🚫')).toBeInTheDocument()
  })

  it('renders 🚫 when newStock is 0 regardless of severity', () => {
    render(
      <InlineStockAlert
        productId="p1"
        productName="Giày"
        newStock={0}
        severity="warning"
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByText('🚫')).toBeInTheDocument()
  })

  it('renders red styling for critical state', () => {
    const { container } = render(
      <InlineStockAlert
        productId="p1"
        productName="Sản phẩm"
        newStock={1}
        severity="critical"
        onDismiss={vi.fn()}
      />,
    )
    const div = container.querySelector('.bg-red-100')
    expect(div).toBeInTheDocument()
  })

  it('renders orange styling for warning state', () => {
    const { container } = render(
      <InlineStockAlert
        productId="p1"
        productName="Sản phẩm"
        newStock={3}
        severity="warning"
        onDismiss={vi.fn()}
      />,
    )
    const div = container.querySelector('.bg-orange-100')
    expect(div).toBeInTheDocument()
  })

  it('calls onDismiss after 5 seconds', () => {
    const onDismiss = vi.fn()
    render(
      <InlineStockAlert
        productId="p1"
        productName="Sản phẩm"
        newStock={3}
        severity="warning"
        onDismiss={onDismiss}
      />,
    )

    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5100)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
