import { describe, it, expect} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchNoResults from '../SearchNoResults'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ...rest } = props
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    )
  },
}))

describe('SearchNoResults', () => {
  it('renders search term in message', () => {
    render(<SearchNoResults searchTerm="abc xyz" />)
    expect(screen.getByText(/abc xyz/)).toBeInTheDocument()
  })

  it('renders suggestion section', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Bạn có thể thử:')).toBeInTheDocument()
  })

  it('renders check spelling suggestion', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Kiểm tra lỗi chính tả')).toBeInTheDocument()
  })

  it('renders shorter keywords suggestion', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Sử dụng từ khóa ngắn hơn')).toBeInTheDocument()
  })

  it('renders popular keywords suggestion', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Sử dụng từ khóa phổ biến hơn')).toBeInTheDocument()
  })

  it('renders popular searches section', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText(/Tìm kiếm phổ biến/)).toBeInTheDocument()
  })

  it('renders popular search terms', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Điện thoại')).toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Áo thun nam')).toBeInTheDocument()
  })

  it('calls onPopularSearch when popular term clicked', () => {
    const onPopularSearch = vi.fn()
    render(<SearchNoResults searchTerm="test" onPopularSearch={onPopularSearch} />)
    fireEvent.click(screen.getByText('Laptop'))
    expect(onPopularSearch).toHaveBeenCalledWith('Laptop')
  })

  it('renders all 8 popular search terms', () => {
    render(<SearchNoResults searchTerm="test" />)
    expect(screen.getByText('Tai nghe bluetooth')).toBeInTheDocument()
    expect(screen.getByText('Giày sneaker')).toBeInTheDocument()
    expect(screen.getByText('Túi xách nữ')).toBeInTheDocument()
    expect(screen.getByText('Đồng hồ')).toBeInTheDocument()
    expect(screen.getByText('Mỹ phẩm')).toBeInTheDocument()
  })

  it('does not crash without onPopularSearch', () => {
    render(<SearchNoResults searchTerm="test" />)
    fireEvent.click(screen.getByText('Laptop'))
    // No error thrown
  })
})
