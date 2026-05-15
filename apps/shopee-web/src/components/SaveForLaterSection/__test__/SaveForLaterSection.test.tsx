import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import SaveForLaterSection from '../SaveForLaterSection'

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

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
  generateNameId: ({ name, id }: any) => `${name}-i-${id}`,
}))

vi.mock('src/constant/path', () => ({
  default: { home: '/' },
}))

vi.mock('date-fns', () => ({
  differenceInDays: () => 0,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'savedForLater.title': 'Đã lưu để mua sau',
        'savedForLater.empty': 'Chưa có sản phẩm nào được lưu',
        'savedForLater.moveToCart': 'Thêm vào giỏ',
        'savedForLater.remove': 'Xóa',
        'savedForLater.clearAll': 'Xóa tất cả',
        'savedForLater.today': 'Hôm nay',
        'savedForLater.yesterday': 'Hôm qua',
        'savedForLater.savedInfo': 'Đã lưu {{time}} • SL: {{count}}',
      }

      if (key === 'savedForLater.daysAgo' && params?.count) {
        return `${params.count} ngày trước`
      }

      if (key === 'savedForLater.savedInfo' && params) {
        return `${params.time} • SL: ${params.count}`
      }

      return translations[key] || key
    },
    i18n: { language: 'vi' },
  }),
}))

const makeItem = (id: string, overrides: any = {}) => ({
  product: {
    _id: id,
    name: `Product ${id}`,
    image: 'img.jpg',
    price: 100000,
    price_before_discount: 150000,
    ...overrides.product,
  },
  savedAt: '2026-03-19T08:00:00Z',
  originalBuyCount: 2,
  ...overrides,
})

describe('SaveForLaterSection', () => {
  const baseProps = {
    savedItems: [] as any[],
    onMoveToCart: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  }

  it('renders empty state when no items', () => {
    render(<SaveForLaterSection {...baseProps} />)
    expect(screen.getByText('Chưa có sản phẩm nào được lưu')).toBeInTheDocument()
  })

  it('renders saved items header with count', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1'), makeItem('2')]} />)
    expect(screen.getByText(/Đã lưu để mua sau \(2\)/)).toBeInTheDocument()
  })

  it('renders product names', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText('Product 1')).toBeInTheDocument()
  })

  it('renders prices', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText(/₫150,000/)).toBeInTheDocument()
    expect(screen.getByText(/₫100,000/)).toBeInTheDocument()
  })

  it('renders move to cart button', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText('Thêm vào giỏ')).toBeInTheDocument()
  })

  it('renders remove button', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText('Xóa')).toBeInTheDocument()
  })

  it('renders clear all button', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText('Xóa tất cả')).toBeInTheDocument()
  })

  it('renders saved time info', () => {
    render(<SaveForLaterSection {...baseProps} savedItems={[makeItem('1')]} />)
    expect(screen.getByText(/Hôm nay/)).toBeInTheDocument()
    expect(screen.getByText(/SL: 2/)).toBeInTheDocument()
  })

  it('renders bookmark icon in empty state', () => {
    const { container } = render(<SaveForLaterSection {...baseProps} />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
  })
})
