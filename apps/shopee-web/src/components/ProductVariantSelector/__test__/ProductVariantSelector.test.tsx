import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductVariantSelector from '../ProductVariantSelector'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}))

const colorVariant = {
  _id: 'v1',
  type: 'color',
  name: 'Màu sắc',
  options: [
    { value: 'red', name: 'Đỏ', image: '' },
    { value: 'blue', name: 'Xanh', image: 'blue.jpg' },
  ],
}

const sizeVariant = {
  _id: 'v2',
  type: 'size',
  name: 'Kích thước',
  options: [
    { value: 'S', name: 'S' },
    { value: 'M', name: 'M' },
    { value: 'L', name: 'L' },
  ],
}

const combinations = [
  { variant_values: { color: 'red', size: 'S' }, quantity: 10 },
  { variant_values: { color: 'red', size: 'M' }, quantity: 5 },
  { variant_values: { color: 'blue', size: 'S' }, quantity: 0 },
  { variant_values: { color: 'blue', size: 'M' }, quantity: 8 },
  { variant_values: { color: 'blue', size: 'L' }, quantity: 3 },
]

describe('ProductVariantSelector', () => {
  const onSelect = vi.fn()

  it('renders color variant label', () => {
    render(
      <ProductVariantSelector
        variants={[colorVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('Màu sắc')).toBeInTheDocument()
  })

  it('renders size variant label', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('Kích thước')).toBeInTheDocument()
  })

  it('renders size option buttons', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByRole('radio', { name: 'S' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'M' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'L' })).toBeInTheDocument()
  })

  it('calls onSelect when clicking available size option', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'S' }))
    expect(onSelect).toHaveBeenCalledWith('size', 'S')
  })

  it('does not call onSelect for unavailable option', () => {
    onSelect.mockClear()
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{ color: 'red' }}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'L' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows validation error message', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
        showValidationError={true}
      />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('hides validation error when not set', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
        showValidationError={false}
      />,
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders color option with image', () => {
    const { container } = render(
      <ProductVariantSelector
        variants={[colorVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    const img = container.querySelector('img[src="blue.jpg"]')
    expect(img).not.toBeNull()
  })

  it('renders color option without image as gradient', () => {
    const { container } = render(
      <ProductVariantSelector
        variants={[colorVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    const gradient = container.querySelector('.bg-gradient-to-br')
    expect(gradient).not.toBeNull()
  })

  it('marks selected option with aria-checked', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{ size: 'M' }}
        onSelect={onSelect}
      />,
    )
    const mButton = screen.getByRole('radio', { name: 'M, đã chọn' })
    expect(mButton).toHaveAttribute('aria-checked', 'true')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
        className="custom"
      />,
    )
    expect(container.firstChild).toHaveClass('custom')
  })

  it('renders both color and size variants', () => {
    render(
      <ProductVariantSelector
        variants={[colorVariant, sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{}}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('Màu sắc')).toBeInTheDocument()
    expect(screen.getByText('Kích thước')).toBeInTheDocument()
  })

  it('disables unavailable size options', () => {
    render(
      <ProductVariantSelector
        variants={[sizeVariant] as any}
        combinations={combinations as any}
        selectedValues={{ color: 'red' }}
        onSelect={onSelect}
      />,
    )
    const lButton = screen.getByRole('radio', { name: 'L' })
    expect(lButton).toBeDisabled()
  })
})
