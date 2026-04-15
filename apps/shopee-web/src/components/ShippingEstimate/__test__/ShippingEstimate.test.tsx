import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShippingEstimate from '../ShippingEstimate'
import type { ShippingOption } from '../ShippingEstimate'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        title: 'Vận chuyển',
        from: 'Từ',
        to: 'Đến',
        noAddress: 'Chưa có địa chỉ',
        addressPlaceholder: 'Nhập địa chỉ',
        addressAria: 'Địa chỉ giao hàng',
        change: 'Thay đổi',
        done: 'Xong',
        methodLabel: 'Phương thức vận chuyển',
        'option.instant': 'Hỏa tốc',
        'option.express': 'Nhanh',
        'option.standard': 'Tiêu chuẩn',
        fastest: 'Nhanh nhất',
        shippingFee: 'Phí vận chuyển',
      }
      if (key === 'deliverOn') return `Giao ngày ${params?.date}`
      if (key === 'deliverRange') return `Giao ${params?.minDate} - ${params?.maxDate}`
      return translations[key] || key
    },
  }),
}))

vi.mock('date-fns', () => ({
  addDays: (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },
  format: (date: Date, formatStr: string) => '01/01',
}))

vi.mock('date-fns/locale', () => ({
  vi: {},
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

describe('ShippingEstimate', () => {
  const defaultProps = {
    productLocation: 'Hà Nội',
  }

  it('renders shipping estimate component', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Vận chuyển')).toBeInTheDocument()
  })

  it('displays product location', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Từ')).toBeInTheDocument()
    expect(screen.getByText('Hà Nội')).toBeInTheDocument()
  })

  it('displays selected address', () => {
    render(<ShippingEstimate {...defaultProps} selectedAddress="123 Main St" />)
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('displays no address message when no address provided', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Chưa có địa chỉ')).toBeInTheDocument()
  })

  it('shows address input when change button is clicked', () => {
    render(<ShippingEstimate {...defaultProps} selectedAddress="123 Main St" />)
    const changeButton = screen.getByRole('button', { name: 'Thay đổi' })
    fireEvent.click(changeButton)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('123 Main St')
  })

  it('updates address when typing in input', () => {
    const onAddressChange = vi.fn()
    render(<ShippingEstimate {...defaultProps} onAddressChange={onAddressChange} />)

    const changeButton = screen.getByRole('button', { name: 'Thay đổi' })
    fireEvent.click(changeButton)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '456 New St' } })

    expect(onAddressChange).toHaveBeenCalledWith('456 New St')
  })

  it('closes address input when done button is clicked', () => {
    render(<ShippingEstimate {...defaultProps} selectedAddress="123 Main St" />)

    const changeButton = screen.getByRole('button', { name: 'Thay đổi' })
    fireEvent.click(changeButton)

    const doneButton = screen.getByRole('button', { name: 'Xong' })
    fireEvent.click(doneButton)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('closes address input on blur', () => {
    render(<ShippingEstimate {...defaultProps} selectedAddress="123 Main St" />)

    const changeButton = screen.getByRole('button', { name: 'Thay đổi' })
    fireEvent.click(changeButton)

    const input = screen.getByRole('textbox')
    fireEvent.blur(input)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('closes address input on Enter key', () => {
    render(<ShippingEstimate {...defaultProps} selectedAddress="123 Main St" />)

    const changeButton = screen.getByRole('button', { name: 'Thay đổi' })
    fireEvent.click(changeButton)

    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders all shipping options', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Hỏa tốc')).toBeInTheDocument()
    expect(screen.getByText('Nhanh')).toBeInTheDocument()
    expect(screen.getByText('Tiêu chuẩn')).toBeInTheDocument()
  })

  it('shows fastest badge for instant shipping', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Nhanh nhất')).toBeInTheDocument()
  })

  it('selects instant shipping by default', () => {
    render(<ShippingEstimate {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toBeChecked()
  })

  it('changes selected shipping option when clicked', () => {
    const onShippingSelect = vi.fn()
    render(<ShippingEstimate {...defaultProps} onShippingSelect={onShippingSelect} />)

    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])

    expect(onShippingSelect).toHaveBeenCalled()
    expect(radios[1]).toBeChecked()
  })

  it('displays shipping fee for selected option', () => {
    render(<ShippingEstimate {...defaultProps} />)
    expect(screen.getByText('Phí vận chuyển')).toBeInTheDocument()
    const fees = screen.getAllByText(/45\.000/)
    expect(fees.length).toBeGreaterThanOrEqual(1)
  })

  it('updates shipping fee when option changes', () => {
    render(<ShippingEstimate {...defaultProps} />)

    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[2]) // Standard shipping

    const fees = screen.getAllByText(/₫15.000/)
    expect(fees.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(<ShippingEstimate {...defaultProps} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<ShippingEstimate {...defaultProps} />)

    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toHaveAttribute('aria-labelledby', 'shipping-options-label')

    const radios = screen.getAllByRole('radio')
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('aria-checked')
      expect(radio).toHaveAttribute('aria-describedby')
    })
  })

  it('displays delivery date range for each option', () => {
    render(<ShippingEstimate {...defaultProps} />)
    // Date format is mocked to return '01/01', so delivery ranges show 'Giao 01/01 - 01/01'
    const deliveryTexts = screen.getAllByText(/Giao/)
    expect(deliveryTexts.length).toBeGreaterThan(0)
  })

  it('memoizes selected option', () => {
    const { rerender } = render(<ShippingEstimate {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toBeChecked()

    rerender(<ShippingEstimate {...defaultProps} productLocation="TP.HCM" />)
    expect(radios[0]).toBeChecked()
  })
})
