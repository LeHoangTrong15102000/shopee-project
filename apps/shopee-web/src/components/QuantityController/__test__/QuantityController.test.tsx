import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuantityController from '../QuantityController'

vi.mock('src/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}))

vi.mock('src/components/InputNumber', () => ({
  default: ({ value, onChange, onBlur, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      data-testid="quantity-input"
      {...props}
    />
  ),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/DeleteModal', () => ({
  default: ({ open, handleIsAgree, handleIsCancel }: any) =>
    open ? (
      <div data-testid="delete-modal">
        <button onClick={handleIsAgree}>Agree</button>
        <button onClick={handleIsCancel}>Cancel</button>
      </div>
    ) : null,
}))

describe('QuantityController', () => {
  it('renders decrease button', () => {
    render(<QuantityController />)
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument()
  })

  it('renders increase button', () => {
    render(<QuantityController />)
    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument()
  })

  it('renders quantity input', () => {
    render(<QuantityController value={5} />)
    expect(screen.getByTestId('quantity-input')).toBeInTheDocument()
  })

  it('calls onIncrease when increase clicked', () => {
    const onIncrease = vi.fn()
    render(<QuantityController value={3} onIncrease={onIncrease} />)
    fireEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onIncrease).toHaveBeenCalledWith(4)
  })

  it('calls onDecrease when decrease clicked', () => {
    const onDecrease = vi.fn()
    render(<QuantityController value={3} onDecrease={onDecrease} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(onDecrease).toHaveBeenCalledWith(2)
  })

  it('does not exceed max on increase', () => {
    const onIncrease = vi.fn()
    render(<QuantityController value={5} max={5} onIncrease={onIncrease} />)
    fireEvent.click(screen.getByLabelText('Increase quantity'))
    expect(onIncrease).toHaveBeenCalledWith(5)
  })

  it('does not go below 1 on decrease', () => {
    const onDecrease = vi.fn()
    render(<QuantityController value={1} onDecrease={onDecrease} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(onDecrease).toHaveBeenCalledWith(1)
  })

  it('calls onType when input changes', () => {
    const onType = vi.fn()
    render(<QuantityController value={3} onType={onType} />)
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '7' } })
    expect(onType).toHaveBeenCalledWith(7)
  })

  it('clamps input value to max', () => {
    const onType = vi.fn()
    render(<QuantityController value={3} max={5} onType={onType} />)
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '10' } })
    expect(onType).toHaveBeenCalledWith(5)
  })

  it('clamps input value to min 1', () => {
    const onType = vi.fn()
    render(<QuantityController value={3} onType={onType} />)
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '0' } })
    expect(onType).toHaveBeenCalledWith(1)
  })

  it('calls onFocusOut on blur', () => {
    const onFocusOut = vi.fn()
    render(<QuantityController value={3} onFocusOut={onFocusOut} />)
    fireEvent.blur(screen.getByTestId('quantity-input'), { target: { value: '3' } })
    expect(onFocusOut).toHaveBeenCalledWith(3)
  })

  it('shows delete modal when decrease below 1 in cart mode', () => {
    const product = { _id: '123', name: 'Test' } as any
    render(<QuantityController value={1} isQuantityInCart={true} product={product} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
  })

  it('does not show delete modal when not in cart mode', () => {
    render(<QuantityController value={1} />)
    fireEvent.click(screen.getByLabelText('Decrease quantity'))
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
  })

  it('applies custom classNameWrapper', () => {
    const { container } = render(<QuantityController classNameWrapper="custom-wrapper" />)
    expect(container.firstChild).toHaveClass('custom-wrapper')
  })
})
