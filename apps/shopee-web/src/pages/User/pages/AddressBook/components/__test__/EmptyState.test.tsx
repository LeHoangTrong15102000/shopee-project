import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '../EmptyState'

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noAddress: 'Chưa có địa chỉ nào',
        'empty.description':
          'Thêm địa chỉ giao hàng để việc mua sắm trở nên nhanh chóng và thuận tiện hơn',
        'empty.feature.fastDelivery': 'Giao hàng nhanh',
        'empty.feature.multipleAddresses': 'Lưu nhiều địa chỉ',
        'empty.feature.easyCheckout': 'Thanh toán dễ dàng',
        addFirst: 'Thêm địa chỉ đầu tiên',
      }
      return translations[key] || key
    },
    i18n: { language: 'vi' },
  }),
}))

describe('EmptyState', () => {
  it('renders empty state title', () => {
    render(<EmptyState onAddNew={vi.fn()} />)
    expect(screen.getByText('Chưa có địa chỉ nào')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<EmptyState onAddNew={vi.fn()} />)
    expect(screen.getByText(/Thêm địa chỉ giao hàng/)).toBeInTheDocument()
  })

  it('renders add button', () => {
    render(<EmptyState onAddNew={vi.fn()} />)
    expect(screen.getByText('Thêm địa chỉ đầu tiên')).toBeInTheDocument()
  })

  it('calls onAddNew when button clicked', () => {
    const onAddNew = vi.fn()
    render(<EmptyState onAddNew={onAddNew} />)
    fireEvent.click(screen.getByText('Thêm địa chỉ đầu tiên'))
    expect(onAddNew).toHaveBeenCalled()
  })

  it('renders feature list', () => {
    render(<EmptyState onAddNew={vi.fn()} />)
    expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument()
    expect(screen.getByText('Lưu nhiều địa chỉ')).toBeInTheDocument()
    expect(screen.getByText('Thanh toán dễ dàng')).toBeInTheDocument()
  })
})
