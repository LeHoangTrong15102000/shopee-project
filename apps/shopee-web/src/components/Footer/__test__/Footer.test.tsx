import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

let mockReducedMotion = false
vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

let mockIsMobile = false
vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('src/styles/animations', () => ({
  sectionEntrance: { hidden: {}, visible: {} },
  staggerContainer: () => ({ hidden: {}, visible: {} }),
  staggerItem: { hidden: {}, visible: {} },
  STAGGER_DELAY: { slow: 0.1 },
}))

describe('Footer', () => {
  it('renders footer element', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).not.toBeNull()
  })

  it('shows policy links', () => {
    render(<Footer />)
    expect(screen.getByText('Chính sách bảo mật')).toBeInTheDocument()
    expect(screen.getByText('Điều khoản dịch vụ')).toBeInTheDocument()
    expect(screen.getByText('Chính sách vận chuyển')).toBeInTheDocument()
    expect(screen.getByText('Chính sách trả hàng/hoàn tiền')).toBeInTheDocument()
  })

  it('shows company info', () => {
    render(<Footer />)
    expect(screen.getByText('Công ty TNHH Shopee')).toBeInTheDocument()
    expect(screen.getByText(/Tầng 4-5-6/)).toBeInTheDocument()
    expect(screen.getByText(/Mã số doanh nghiệp/)).toBeInTheDocument()
  })

  it('shows copyright', () => {
    render(<Footer />)
    const copyrights = screen.getAllByText(/Bản quyền thuộc về/)
    expect(copyrights.length).toBeGreaterThanOrEqual(1)
  })

  it('shows country list', () => {
    const { container } = render(<Footer />)
    expect(container.textContent).toContain('Singapore')
    expect(container.textContent).toContain('Việt Nam')
  })

  it('renders certification badge links', () => {
    const { container } = render(<Footer />)
    const links = container.querySelectorAll('a[href="/"]')
    expect(links.length).toBeGreaterThanOrEqual(4)
  })

  it('renders with reduced motion', () => {
    mockReducedMotion = true
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).not.toBeNull()
    mockReducedMotion = false
  })

  it('renders on mobile', () => {
    mockIsMobile = true
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).not.toBeNull()
    mockIsMobile = false
  })
})
