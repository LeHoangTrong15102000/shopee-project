import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartHeader from '../CartHeader'

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
              'whileInView',
              'viewport',
              'layout',
              'layoutId',
              'style',
            ].includes(k),
        ),
      )
      return <div {...safe}>{children}</div>
    },
    form: ({ children, ...props }: any) => {
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
      return <form {...safe}>{children}</form>
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/cart' }),
}))

vi.mock('src/hooks/useSearchProducts', () => ({
  default: () => ({
    onSubmitSearch: vi.fn((e: any) => e?.preventDefault?.()),
    register: () => ({}),
  }),
}))

vi.mock('src/components/NavHeader', () => ({
  default: () => <div data-testid="nav-header">NavHeader</div>,
}))

vi.mock('src/components/MobileNavigationDrawer', () => ({
  default: ({ isOpen }: any) => (isOpen ? <div data-testid="drawer">Drawer</div> : null),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, type, ...props }: any) => (
    <button onClick={onClick} className={className} type={type} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/constant/path', () => ({
  default: { home: '/', cart: '/cart', checkout: '/checkout' },
}))

describe('CartHeader', () => {
  it('renders default title from translation', () => {
    render(<CartHeader />)
    expect(screen.getByText('giỏ hàng')).toBeInTheDocument()
  })

  it('renders custom title when provided', () => {
    render(<CartHeader title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders search input with placeholder', () => {
    render(<CartHeader />)
    const input = screen.getByPlaceholderText('Đăng ký và nhận voucher bạn mới đến 70k!')
    expect(input).toBeInTheDocument()
  })

  it('renders NavHeader component', () => {
    render(<CartHeader />)
    expect(screen.getByTestId('nav-header')).toBeInTheDocument()
  })

  it('renders hamburger menu button', () => {
    render(<CartHeader />)
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument()
  })

  it('opens drawer when hamburger clicked', () => {
    render(<CartHeader />)
    fireEvent.click(screen.getByLabelText('Open navigation menu'))
    expect(screen.getByTestId('drawer')).toBeInTheDocument()
  })

  it('renders shopping flow stepper by default', () => {
    render(<CartHeader />)
    const stepLabels = screen.getAllByText('Giỏ hàng')
    expect(stepLabels.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Hoàn tất')).toBeInTheDocument()
  })

  it('hides stepper when showStepper is false', () => {
    render(<CartHeader showStepper={false} />)
    expect(screen.queryByText('Hoàn tất')).toBeNull()
  })

  it('renders breadcrumb with home and cart', () => {
    render(<CartHeader />)
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
  })

  it('renders Shopee logo SVG', () => {
    const { container } = render(<CartHeader />)
    const svg = container.querySelector('svg[viewBox="0 0 192 65"]')
    expect(svg).not.toBeNull()
  })
})
